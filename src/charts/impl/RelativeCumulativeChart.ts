import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
} from "@/backend/model"
import { CHART_GRID, Chart, type Resolve } from "@/charts/impl/Chart"
import { formatSlot, intervalSlots } from "@/charts/impl/dateUtils"
import { formatTooltip, round2 } from "@/charts/impl/utils"
import { m } from "@/shared/paraglide/messages"
import type { EChartsOption } from "echarts"
import type { CallbackDataParams } from "echarts/types/dist/shared"

export class RelativeCumulativeChart extends Chart {
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
    const range = intervalSlots(interval, startDateTime, endDateTime)
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

    const columnAverage = new Array<number>(rangeLength)
    const runningTotals = new Float64Array(userCount)

    for (let t = 0; t < rangeLength; t++) {
      let columnSum = 0

      for (let u = 0; u < userCount; u++) {
        const idx = u * rangeLength + t
        runningTotals[u] += matrix[idx]
        matrix[idx] = runningTotals[u]
        columnSum += runningTotals[u]
      }

      columnAverage[t] = userCount > 0 ? round2(columnSum / userCount) : 0
    }

    for (let t = 0; t < rangeLength; t++) {
      const avg = columnAverage[t]

      for (let u = 0; u < userCount; u++) {
        const idx = u * rangeLength + t
        matrix[idx] -= avg
      }
    }

    const series = userItems.map((item, u) => ({
      name: item.name,
      type: "line" as const,
      data: Array.from(matrix.subarray(u * rangeLength, (u + 1) * rangeLength), round2).map(
        (value) => ({ value, fullName: item.name, img: item.imageUrl }),
      ),
    }))

    const referenceSeries = {
      name: m.average_label(),
      type: "line" as const,
      data: new Array(rangeLength).fill(0),
      lineStyle: {
        type: "dashed" as const,
        width: 2,
        color: "#000000",
      },
      itemStyle: {
        color: "#000000",
      },
      symbol: "none" as const,
      z: 10,
      tooltip: {
        show: false,
      },
    }

    return {
      tooltip: {
        formatter: (param) => formatTooltip(interval, param as CallbackDataParams),
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
          formatter: (value: string) => formatSlot(interval, value),
        },
      },
      yAxis: {
        type: "value",
      },
      series: [...series, referenceSeries],
      grid: CHART_GRID,
    }
  }

  hasGroup(): boolean {
    return true
  }
}
