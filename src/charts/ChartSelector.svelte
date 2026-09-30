<script lang="ts">
  import { getCourseLogsMetrics } from "@/backend/services/course-logs"
  import ChartComponent from "@/charts/ChartComponent.svelte"
  import ChartSettings from "@/charts/ChartSettings.svelte"
  import TableComponent from "@/charts/TableComponent.svelte"
  import type { Chart } from "@/charts/impl/Chart"
  import { CumulativeChart } from "@/charts/impl/CumulativeChart"
  import { HeatMapChart } from "@/charts/impl/HeatMapChart"
  import { RelativeCumulativeChart } from "@/charts/impl/RelativeCumulativeChart"
  import { TotalChart } from "@/charts/impl/TotalChart"
  import { appStore, getSelectedUsers } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"
  import type { EChartsOption } from "echarts"

  const chartTypes = [
    { name: "total", chart: new TotalChart() },
    { name: "heatmap", chart: new HeatMapChart() },
    { name: "cumulative", chart: new CumulativeChart() },
    { name: "relative_cumulative", chart: new RelativeCumulativeChart() },
  ] as const satisfies Array<{ name: string; chart: Chart }>

  let selectedChart = $state("total")
  let currentChart = $derived(chartTypes.find((o) => o.name === selectedChart)?.chart as Chart)
  let showScale = $derived(currentChart?.hasScale() ?? false)
  let showGroup = $derived(currentChart?.hasGroup() ?? false)

  const sections = $derived(appStore.sectionItems.filter(({ checked }) => checked))
  const modules = $derived(appStore.moduleItems.filter(({ checked }) => checked))

  let option = $state<EChartsOption>()

  $effect(() => {
    if (currentChart == null) return

    let cancelled = false
    const selectedUsers = getSelectedUsers()

    currentChart.setSelectedInfo(appStore.selectedInfo)

    getCourseLogsMetrics(appStore.currentCourseId, {
      fields: currentChart.getFields(),
      timeRange: { from: appStore.from, to: appStore.to },
      groupBy: currentChart.getGroupBy(),
      filters: {
        userIds: selectedUsers.map(({ id }) => id),
        moduleIds: appStore.selectedInfo === "module" ? modules.map(({ id }) => id) : undefined,
        sectionIds: appStore.selectedInfo === "section" ? sections.map(({ id }) => id) : undefined,
      },
      interval: showGroup ? appStore.group : undefined,
    }).then(({ rows }) => {
      if (cancelled) return

      option = currentChart.resolveOptions({
        userItems: selectedUsers,
        sectionItems: sections,
        moduleItems: modules,
        startDateTime: appStore.from,
        endDateTime: appStore.to,
        interval: appStore.group,
        scale: appStore.scale,
        rows,
      })
    })

    return () => {
      cancelled = true
    }
  })
</script>

<main class="flex size-full flex-col">
  <div class="tabs tabs-box rounded-none">
    {#each chartTypes as { name } (name)}
      <input
        type="radio"
        name="chart_select"
        class="tab"
        aria-label={m[name]()}
        value={name}
        bind:group={selectedChart}
      />
    {/each}
    <input
      type="radio"
      name="chart_select"
      class="tab"
      aria-label={m.table()}
      value="table"
      bind:group={selectedChart}
    />
  </div>
  {#if selectedChart === "table"}
    <TableComponent />
  {:else}
    <ChartComponent {option} />
  {/if}
  <ChartSettings {showScale} {showGroup} />
</main>
