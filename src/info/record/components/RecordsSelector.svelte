<script lang="ts">
  import type { RecordDisplay } from "../RecordDisplay"
  import { RecordTable } from "../table/RecordTable"
  import { courseStore } from "@/dashboard/course.svelte"
  import { displayStore } from "@/display/display.svelte"
  import { CumulativeChart } from "@/info/record/chart/CumulativeChart"
  import { HeatMapChart } from "@/info/record/chart/HeatMapChart"
  import { RelativeCumulativeChart } from "@/info/record/chart/RelativeCumulativeChart"
  import { TotalChart } from "@/info/record/chart/TotalChart"
  import RecordItem from "@/info/record/components/RecordItem.svelte"
  import { recordStore, type RecordType } from "@/info/record/record.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { getSelectedUsers } from "@/user/user.svelte"

  interface Props {
    active: boolean
  }

  let { active = $bindable() }: Props = $props()

  let selected = $state<RecordType>("component")

  const tabs = [
    { value: "component", label: m.components_label, items: () => recordStore.componentItems },
    { value: "event", label: m.events_label, items: () => recordStore.eventItems },
    { value: "section", label: m.section_label, items: () => recordStore.sectionItems },
    { value: "module", label: m.modules_label, items: () => recordStore.moduleItems },
  ]

  type DisplayType = "total" | "heatmap" | "cumulative" | "relative_cumulative" | "table"

  const displayTypes = {
    total: new TotalChart(),
    heatmap: new HeatMapChart(),
    cumulative: new CumulativeChart(),
    relative_cumulative: new RelativeCumulativeChart(),
    table: new RecordTable(),
  } as const satisfies Record<DisplayType, RecordDisplay>

  $effect(() => {
    if (!active) return

    displayStore.display = Object.keys(displayTypes)
    displayStore.selectedDisplay = "total"
    displayStore.showGroup = displayTypes.total.hasGroup()
    displayStore.showScale = displayTypes.total.hasScale()
  })

  $effect(() => {
    if (!active) return

    const selectedItems = tabs
      .find(({ value }) => value === selected)!
      .items()
      .filter(({ checked }) => checked)
    const display = displayTypes[displayStore.selectedDisplay as DisplayType]

    displayStore.showGroup = display.hasGroup()
    displayStore.showScale = display.hasScale()

    const selectedUsers = getSelectedUsers()

    display
      .resolveConfig({
        courseId: courseStore.currentCourseId,
        from: displayStore.from,
        to: displayStore.to,
        interval: displayStore.group,
        scale: displayStore.scale,
        userItems: selectedUsers,
        selectedInfo: selected,
        selectedItems,
      })
      .then((option) => {
        displayStore.displayType = option.type
        displayStore.displayOption = option.option
      })
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
      <SelectButtons class="border-b border-base-200 p-1" items={tab.items()} />
      <Select component={RecordItem} items={tab.items()} ariaLabel={tab.label()} />
    </div>
  {/each}
</div>
