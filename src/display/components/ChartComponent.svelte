<script lang="ts">
  import echarts, { type ECOption } from "@/display/impl/echarts"
  import type { Attachment } from "svelte/attachments"

  interface Props {
    option: ECOption
  }

  let { option }: Props = $props()

  const CHART_GRID = {
    right: 16,
    bottom: 16,
    left: 16,
    outerBoundsMode: "same",
  } as const

  let chart = $state.raw<echarts.ECharts | undefined>(undefined)
  let previousStructure: string | undefined

  function getStructure(items: unknown) {
    const list = Array.isArray(items) ? items : items ? [items] : []
    return list.map((item) =>
      typeof item === "object" && item !== null && "type" in item ? item.type : "unknown",
    )
  }

  function getChartStructure(value: ECOption) {
    return JSON.stringify({
      series: getStructure(value.series),
      xAxis: getStructure(value.xAxis),
      yAxis: getStructure(value.yAxis),
    })
  }

  const attachChart: Attachment<HTMLDivElement> = (container) => {
    const instance = echarts.init(container)
    chart = instance
    previousStructure = undefined

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      instance.dispose()
      if (chart === instance) chart = undefined
    }
  }

  $effect(() => {
    if (!chart) return
    const structure = getChartStructure(option)
    chart.setOption(
      { ...option, grid: CHART_GRID },
      { notMerge: previousStructure !== structure, lazyUpdate: true },
    )
    previousStructure = structure
  })
</script>

<div class="size-full" {@attach attachChart}></div>
