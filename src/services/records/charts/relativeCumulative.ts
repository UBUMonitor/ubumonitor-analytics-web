import { round2 } from "@/services/display/utils"
import { buildCumulativeData, buildUserSeries, lineChartBase } from "@/services/records/charts/line"
import {
  EMPTY_CHART_MAX_Y,
  requestLogsStatistics,
  type ChartParams,
} from "@/services/records/shared"
import type { DisplayConfig } from "@/stores/display.svelte"

export async function recordsRelativeCumulativeChart(params: ChartParams): Promise<DisplayConfig> {
  const { interval, userItems } = params

  const rows = await requestLogsStatistics(params, { fields: ["USER_ID"], interval })
  const isEmpty = rows.length === 0

  const data = buildCumulativeData(rows, params)

  return {
    type: "chart",
    option: {
      ...lineChartBase(interval, data.range),
      yAxis: {
        type: "value",
        min: isEmpty ? -EMPTY_CHART_MAX_Y : undefined,
        max: isEmpty ? EMPTY_CHART_MAX_Y : undefined,
      },
      series: buildUserSeries(userItems, data, (value, t) => round2(value - data.columnAverage[t])),
    },
  }
}
