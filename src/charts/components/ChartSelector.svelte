<script lang="ts">
  import { getCourseLogsMetrics } from "@/backend/services/course-logs"
  import { chartStore } from "@/charts/chart.svelte"
  import ChartComponent from "@/charts/components/ChartComponent.svelte"
  import ChartSettings from "@/charts/components/ChartSettings.svelte"
  import TableComponent from "@/charts/components/TableComponent.svelte"
  import type { Chart } from "@/charts/impl/Chart"
  import { CumulativeChart } from "@/charts/impl/CumulativeChart"
  import { HeatMapChart } from "@/charts/impl/HeatMapChart"
  import { RelativeCumulativeChart } from "@/charts/impl/RelativeCumulativeChart"
  import { TotalChart } from "@/charts/impl/TotalChart"
  import { dashboardStore, getSelectedUsers } from "@/dashboard/dashboard.svelte"
  import { courseStore } from "@/header/course.svelte"
  import { m } from "@/shared/paraglide/messages"
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

  const sections = $derived(dashboardStore.sectionItems.filter(({ checked }) => checked))
  const modules = $derived(dashboardStore.moduleItems.filter(({ checked }) => checked))
  const components = $derived(dashboardStore.componentItems.filter(({ checked }) => checked))
  const events = $derived(dashboardStore.eventItems.filter(({ checked }) => checked))

  let option = $state<EChartsOption>()

  $effect(() => {
    if (!currentChart) return

    const selectedUsers = getSelectedUsers()

    currentChart.setSelectedInfo(dashboardStore.selectedInfo)

    if (
      selectedUsers.length === 0 ||
      (dashboardStore.selectedInfo === "module" && modules.length === 0) ||
      (dashboardStore.selectedInfo === "section" && sections.length === 0) ||
      (dashboardStore.selectedInfo === "component" && components.length === 0) ||
      (dashboardStore.selectedInfo === "event" && events.length === 0)
    ) {
      option = currentChart.resolveOptions({
        userItems: selectedUsers,
        sectionItems: sections,
        moduleItems: modules,
        componentItems: components,
        eventItems: events,
        startDateTime: chartStore.from,
        endDateTime: chartStore.to,
        interval: chartStore.group,
        scale: chartStore.scale,
        rows: [],
      })
      return
    }

    getCourseLogsMetrics(courseStore.currentCourseId, {
      fields: currentChart.getFields(),
      timeRange: { from: chartStore.from, to: chartStore.to },
      groupBy: currentChart.getGroupBy(),
      filters: {
        userIds: selectedUsers.map(({ id }) => id),
        moduleIds:
          dashboardStore.selectedInfo === "module" ? modules.map(({ id }) => id) : undefined,
        sectionIds:
          dashboardStore.selectedInfo === "section" ? sections.map(({ id }) => id) : undefined,
        componentIds:
          dashboardStore.selectedInfo === "component" ? components.map(({ id }) => id) : undefined,
        eventIds: dashboardStore.selectedInfo === "event" ? events.map(({ id }) => id) : undefined,
      },
      interval: showGroup ? chartStore.group : undefined,
    }).then(({ rows }) => {
      option = currentChart.resolveOptions({
        userItems: selectedUsers,
        sectionItems: sections,
        moduleItems: modules,
        componentItems: components,
        eventItems: events,
        startDateTime: chartStore.from,
        endDateTime: chartStore.to,
        interval: chartStore.group,
        scale: chartStore.scale,
        rows,
      })
    })
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
