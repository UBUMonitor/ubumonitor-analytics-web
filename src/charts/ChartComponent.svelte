<script lang="ts">
  import type { EChartsOption } from "echarts"
  import * as echarts from "echarts"
  import { onMount } from "svelte"

  interface Props {
    option?: EChartsOption
  }

  let { option }: Props = $props()

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
    if (option) instance?.setOption(option, { notMerge: true })
  })
</script>

<div class="size-full" bind:this={container}></div>
