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
    { value: "component", label: m.components, items: () => recordStore.componentItems },
    { value: "event", label: m.events, items: () => recordStore.eventItems },
    { value: "section", label: m.section, items: () => recordStore.sectionItems },
    { value: "module", label: m.modules, items: () => recordStore.moduleItems },
  ]

  const displayOptions = [
    { value: "total", label: m.total, display: new TotalChart() },
    { value: "heatmap", label: m.heatmap, display: new HeatMapChart() },
    { value: "cumulative", label: m.cumulative, display: new CumulativeChart() },
    {
      value: "relative_cumulative",
      label: m.relative_cumulative,
      display: new RelativeCumulativeChart(),
    },
    { value: "table", label: m.table, display: new RecordTable() },
  ] satisfies { value: string; label: () => string; display: RecordDisplay }[]

  $effect(() => {
    if (!active) return

    displayStore.display = displayOptions.map(({ value, label }) => ({ value, label }))
    displayStore.selectedDisplay = "total"
    displayStore.showGroup = displayOptions[0].display.hasGroup()
    displayStore.showScale = displayOptions[0].display.hasScale()
  })

  $effect(() => {
    if (!active || courseStore.currentCourse == null) return

    const selectedDisplay = displayOptions.find(
      ({ value }) => value === displayStore.selectedDisplay,
    )

    if (!selectedDisplay) return

    const selectedItems = tabs
      .find(({ value }) => value === selected)!
      .items()
      .filter(({ checked }) => checked)

    const { display } = selectedDisplay

    displayStore.showGroup = display.hasGroup()
    displayStore.showScale = display.hasScale()

    const selectedUsers = getSelectedUsers()

    display
      .resolveConfig({
        courseId: courseStore.currentCourse.id,
        from: displayStore.from,
        to: displayStore.to,
        interval: displayStore.group,
        scale: displayStore.scale,
        userItems: selectedUsers,
        selectedInfo: selected,
        selectedItems,
      })
      .then((option) => {
        displayStore.config = option
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
      {#if recordStore.isLoading}
        {@render skeleton()}
      {:else}
        <Select component={RecordItem} items={tab.items()} ariaLabel={tab.label()} />
      {/if}
    </div>
  {/each}
</div>

{#snippet skeleton()}
  <div class="flex animate-pulse flex-col overflow-hidden">
    {#each { length: 5 }, i (i)}
      <div class="m-1 h-6 w-48 shrink-0 skeleton"></div>
      <div class="m-1 h-6 w-40 shrink-0 skeleton"></div>
      <div class="m-1 h-6 w-56 shrink-0 skeleton"></div>
    {/each}
  </div>
{/snippet}
