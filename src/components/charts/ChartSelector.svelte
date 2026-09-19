<script lang="ts">
  import { appStore, getSelectedUsers } from "@/lib/appStore.svelte"
  import type { Chart } from "@/lib/chart/Chart"
  import { CumulativeChart } from "@/lib/chart/CumulativeChart"
  import { HeatMapChart } from "@/lib/chart/HeatMapChart"
  import { RelativeCumulativeChart } from "@/lib/chart/RelativeCumulativeChart"
  import { TotalChart } from "@/lib/chart/TotalChart"
  import type { CourseLogsMetricsResponseDto } from "@/model"
  import { m } from "@/paraglide/messages"
  import { getCourseLogsMetrics } from "@/services/course-logs/course-logs"
  import type { EChartsOption } from "echarts"
  import ChartComponent from "./ChartComponent.svelte"
  import ChartSettings from "./ChartSettings.svelte"
  import TableComponent from "./TableComponent.svelte"

  const chartTypes = [
    { value: "total", chart: new TotalChart() },
    { value: "heatmap", chart: new HeatMapChart() },
    { value: "cumulative", chart: new CumulativeChart() },
    { value: "relative_cumulative", chart: new RelativeCumulativeChart() },
  ] as const satisfies Array<{ value: string; chart: Chart }>

  let selectedChart = $state("total")
  let currentChart = $derived(chartTypes.find((o) => o.value === selectedChart)?.chart as Chart)
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
    }).then((response) => {
      if (cancelled) return

      const { rows } = response.data as CourseLogsMetricsResponseDto
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
  <div class="tabs-box tabs rounded-none">
    {#each chartTypes as { value } (value)}
      <input
        type="radio"
        name="chart_select"
        class="tab"
        aria-label={m[value]()}
        {value}
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
