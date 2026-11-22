<script lang="ts">
  import echarts, { type ECOption } from "@/services/display/echarts"
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

  const chart: Attachment<HTMLDivElement> = (container) => {
    const instance = echarts.init(container, "app")

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container)

    $effect(() => {
      instance.setOption({ ...option, grid: CHART_GRID }, { notMerge: true })
    })

    return () => {
      observer.disconnect()
      instance.dispose()
    }
  }
</script>

<div class="size-full" {@attach chart}></div>
