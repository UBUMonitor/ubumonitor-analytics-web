import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
} from "@/backend/model"
import { CHART_GRID, Chart, type Resolve } from "@/charts/impl/Chart"
import { formatIntervalLabel, resolveInterval, round2 } from "@/charts/impl/utils"
import { m } from "@/shared/paraglide/messages"
import type { EChartsOption } from "echarts"

export class CumulativeChart extends Chart {
  getFields(): CourseLogsStatisticsRequestDtoFieldsItem[] {
    return ["USER_ID"]
  }

  getGroupBy(): CourseLogsStatisticsRequestDtoGroupByItem[] {
    return ["USER_ID"]
  }

  resolveOptions({
    userItems,
    startDateTime,
    endDateTime,
    interval,
    rows,
  }: Resolve): EChartsOption {
    const range = resolveInterval(interval, startDateTime, endDateTime)
    const rangeLength = range.length
    const userCount = userItems.length

    const dateIndex = new Map(range.map((date, i) => [date, i]))
    const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

    const matrix = new Float64Array(userCount * rangeLength)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.timeBucket || !row.user) continue

      const dateIdx = dateIndex.get(row.timeBucket)
      const userIdx = userIndex.get(row.user.id)

      if (dateIdx === undefined || userIdx === undefined) continue

      matrix[userIdx * rangeLength + dateIdx] = row.value
    }

    // Accumulate per user and sum each column for the average in a single pass.
    const averageData = new Array<number>(rangeLength)
    const runningTotals = new Float64Array(userCount)

    for (let t = 0; t < rangeLength; t++) {
      let columnSum = 0

      for (let u = 0; u < userCount; u++) {
        const idx = u * rangeLength + t
        runningTotals[u] += matrix[idx]
        matrix[idx] = runningTotals[u]
        columnSum += runningTotals[u]
      }

      averageData[t] = userCount > 0 ? round2(columnSum / userCount) : 0
    }

    const series = userItems.map((item, u) => ({
      name: item.name,
      type: "line" as const,
      data: Array.from(matrix.subarray(u * rangeLength, (u + 1) * rangeLength)),
    }))

    const averageSeries = {
      name: m.average_label(),
      type: "line" as const,
      data: averageData,
      lineStyle: {
        type: "dashed" as const,
        width: 2,
      },
      symbol: "none" as const,
      z: 10,
      itemStyle: { color: "#000000" },
    }

    return {
      tooltip: {
        trigger: "axis",
        confine: true,
      },
      legend: {
        type: "scroll",
        top: "top",
        left: "center",
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: range,
        axisLabel: {
          formatter: (value: string) => formatIntervalLabel(value, interval),
        },
      },
      yAxis: {
        type: "value",
      },
      series: [...series, averageSeries],
      grid: CHART_GRID,
    }
  }

  hasGroup(): boolean {
    return true
  }
}
