import type { ECOption } from "@/features/display/impl/echarts"
import { formatTooltip, round2 } from "@/features/display/impl/utils"
import type { Resolve } from "@/features/records/RecordDisplay"
import { RecordChart } from "@/features/records/chart/RecordChart"
import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsResponseRowDto,
} from "@/shared/api/model"
import { formatSlot, intervalSlots } from "@/shared/lib/datetime"
import { m } from "@/shared/paraglide/messages"

export class CumulativeChart extends RecordChart {
  getFields(): CourseLogsStatisticsRequestDtoFieldsItem[] {
    return ["USER_ID"]
  }

  buildOptions(
    rows: CourseLogsStatisticsResponseRowDto[],
    { from, to, interval, userItems }: Resolve,
  ): ECOption {
    const range = intervalSlots(interval, from, to)
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
      data: Array.from(matrix.subarray(u * rangeLength, (u + 1) * rangeLength)).map((value) => ({
        value,
        fullName: item.name,
        img: item.imageUrl,
      })),
    }))

    const averageSeries = {
      name: m.average(),
      type: "line" as const,
      data: averageData,
      lineStyle: {
        type: "dashed" as const,
        width: 2,
      },
      symbol: "none" as const,
      z: 10,
      itemStyle: { color: "#000000" },
      tooltip: {
        show: false,
      },
    }

    return {
      tooltip: {
        formatter: (param) => formatTooltip(interval, param),
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
        min: 0,
        max: rows.length > 0 ? undefined : 10,
      },
      series: userCount > 1 ? [...series, averageSeries] : series,
    }
  }

  hasGroup(): boolean {
    return true
  }
}
