<script module lang="ts">
  import { getDisplayOption } from "@/info/record/displayOptions"
  import type { RecordType } from "@/info/record/record.svelte"
  import { recordStore } from "@/info/record/record.svelte"
  import { m } from "@/shared/paraglide/messages"

  const tabs = [
    { value: "component", label: m.components, items: () => recordStore.componentItems },
    { value: "event", label: m.events, items: () => recordStore.eventItems },
    { value: "section", label: m.section, items: () => recordStore.sectionItems },
    { value: "module", label: m.modules, items: () => recordStore.moduleItems },
  ] satisfies {
    value: RecordType
    label: () => string
    items: () => typeof recordStore.componentItems
  }[]
</script>

<script lang="ts">
  import { courseStore } from "@/dashboard/course.svelte"
  import { displayStore } from "@/display/display.svelte"
  import RecordItem from "@/info/record/components/RecordItem.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { notifyError } from "@/shared/lib/notify"
  import { setChecked } from "@/shared/lib/selection"
  import type { SelectableItem } from "@/shared/types/selectable-item"
  import { userStore } from "@/user/user.svelte"

  interface Props {
    active: boolean
  }

  let { active }: Props = $props()
  let selected = $state<RecordType>("component")

  async function refresh(params: NonNullable<typeof requestParams>) {
    try {
      displayStore.config = await params.option.display.resolveConfig(params.resolve)
    } catch (error) {
      notifyError(error)
    }
  }

  const requestParams = $derived.by(() => {
    if (!active) return undefined

    const course = courseStore.currentCourse
    const option = getDisplayOption(displayStore.selectedDisplay)
    if (!course || !option) return undefined

    const users = userStore.selected
    const selectedItems =
      tabs
        .find(({ value }) => value === selected)
        ?.items()
        .filter(({ checked }) => checked) ?? []

    const resolve = {
      courseId: course.id,
      from: displayStore.from,
      to: displayStore.to,
      interval: displayStore.group,
      userItems: users,
      selectedInfo: selected,
      selectedItems,
      scale: displayStore.scale,
    }

    return { option, resolve }
  })

  $effect(() => {
    const params = requestParams
    if (!params) return
    void refresh(params)
  })
</script>

<div class="tabs tabs-border h-full tabs-sm">
  {#each tabs as tab (tab.value)}
    <input
      type="radio"
      name="records_tabs"
      class="tab"
      aria-label={tab.label()}
      bind:group={selected}
      value={tab.value}
    />
    <div class="tab-content">
      <SelectButtons
        class="border-b border-base-200 p-1"
        items={tab.items()}
        onToggleAll={setChecked}
      />
      <Select
        item={recordItem}
        items={tab.items()}
        ariaLabel={tab.label()}
        onToggle={(item, checked) => (item.checked = checked)}
        onToggleAll={setChecked}
      />
    </div>
  {/each}
</div>

{#snippet recordItem(record: SelectableItem & { modName?: string })}
  <RecordItem item={record} />
{/snippet}
