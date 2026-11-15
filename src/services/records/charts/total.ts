import {
  EMPTY_CHART_MAX_Y,
  getStrategy,
  requestLogsStatistics,
  type ChartParams,
} from "@/services/records/shared"
import type { DisplayConfig } from "@/stores/display.svelte"

export async function recordsTotalChart(params: ChartParams): Promise<DisplayConfig> {
  const { selectedInfo, selectedItems } = params
  const strategy = getStrategy(selectedInfo)

  const rows = await requestLogsStatistics(params, { fields: strategy.fields })
  const isEmpty = rows.length === 0

  const data = selectedItems.map(
    (item) => rows.find((row) => strategy.matches(row, item))?.value ?? 0,
  )

  return {
    type: "chart",
    option: {
      xAxis: {
        type: "category",
        data: selectedItems.map(({ name }) => name),
        axisLabel: { interval: 0, overflow: "truncate", width: 200, rotate: 45 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: isEmpty ? EMPTY_CHART_MAX_Y : undefined,
      },
      series: [{ type: "bar", data }],
      tooltip: {},
    },
  }
}
