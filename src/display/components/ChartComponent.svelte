<script lang="ts">
  import { displayStore } from "@/display/display.svelte"
  import echarts, { type ECOption } from "@/display/impl/echarts"
  import { onMount } from "svelte"

  const CHART_GRID = {
    right: 16,
    bottom: 16,
    left: 16,
    outerBoundsMode: "same",
  } as const

  let container: HTMLDivElement
  let instance: echarts.ECharts

  onMount(() => {
    instance = echarts.init(container)

    const observer = new ResizeObserver(() => instance?.resize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      instance?.dispose()
    }
  })

  $effect(() => {
    instance?.setOption(
      { ...(displayStore.displayOption as ECOption), grid: CHART_GRID },
      { notMerge: true },
    )
  })
</script>

<div class="size-full" bind:this={container}></div>
