import { formatTooltip } from "@/services/display/utils"
import { requestLogsStatistics, type ChartParams } from "@/services/records/shared"
import type { DisplayConfig } from "@/stores/display.svelte"
import { formatSlot, intervalSlots } from "@/utils/datetime"
import type { CallbackDataParams } from "echarts/types/src/util/types.js"

const HEATMAP_SCALE_STEP = 5

type HeatMapDatum = {
  value: [x: number, y: number, count: number]
  fullName: string
  img?: string
}

export async function recordsHeatmapChart(params: ChartParams): Promise<DisplayConfig> {
  const { interval, from, to, scale, userItems } = params
  const range = intervalSlots(interval, from, to)

  const dateIndex = new Map(range.map((date, i) => [date, i]))
  const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

  const rows = await requestLogsStatistics(params, { fields: ["USER_ID"], interval })

  let maxValue = scale
  const data: HeatMapDatum[] = []

  for (const row of rows) {
    const x = row.timeBucket ? dateIndex.get(row.timeBucket) : undefined
    const y = row.user ? userIndex.get(row.user.id) : undefined

    if (x === undefined || y === undefined) continue

    data.push({
      value: [x, y, row.value],
      fullName: userItems[y].name,
      img: userItems[y].imageUrl,
    })

    maxValue = Math.max(maxValue, row.value)
  }

  return {
    type: "chart",
    option: {
      tooltip: {
        formatter: (tooltipParams) => {
          const p = tooltipParams as CallbackDataParams
          return formatTooltip(interval, p, (p.data as HeatMapDatum).value[2])
        },
      },
      xAxis: {
        type: "category",
        data: range,
        splitArea: { show: true },
        axisLabel: {
          rotate: 45,
          formatter: (value: string) => formatSlot(interval, value),
        },
      },
      yAxis: {
        type: "category",
        data: userItems.map(({ name }) => name),
        inverse: true,
        splitArea: { show: true },
      },
      visualMap: {
        min: 0,
        max: Math.ceil(maxValue / HEATMAP_SCALE_STEP) * HEATMAP_SCALE_STEP,
        precision: 0,
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        top: 8,
      },
      series: {
        type: "heatmap",
        data,
        label: { show: true },
      },
    },
  }
}
