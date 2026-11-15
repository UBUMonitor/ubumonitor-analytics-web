import { m } from "@/paraglide/messages"
import { buildCumulativeData, buildUserSeries, lineChartBase } from "@/services/records/charts/line"
import {
  EMPTY_CHART_MAX_Y,
  requestLogsStatistics,
  type ChartParams,
} from "@/services/records/shared"
import type { DisplayConfig } from "@/stores/display.svelte"

export async function recordsCumulativeChart(params: ChartParams): Promise<DisplayConfig> {
  const { interval, userItems } = params

  const rows = await requestLogsStatistics(params, { fields: ["USER_ID"], interval })
  const isEmpty = rows.length === 0

  const data = buildCumulativeData(rows, params)
  const userSeries = buildUserSeries(userItems, data)

  const averageSeries = {
    name: m.average(),
    type: "line" as const,
    data: data.columnAverage,
    lineStyle: { type: "dashed" as const, width: 2 },
    symbol: "none" as const,
    z: 10,
    itemStyle: { color: "#000000" },
    tooltip: { show: false },
  }

  return {
    type: "chart",
    option: {
      ...lineChartBase(interval, data.range),
      yAxis: {
        type: "value",
        min: 0,
        max: isEmpty ? EMPTY_CHART_MAX_Y : undefined,
      },
      series: userItems.length > 1 ? [...userSeries, averageSeries] : userSeries,
    },
  }
}
