import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import type { ECOption } from "@/display/impl/echarts"
import { formatTooltip, round2 } from "@/display/impl/utils"
import type { Resolve } from "@/info/record/RecordDisplay"
import { RecordChart } from "@/info/record/chart/RecordChart"
import { formatSlot, intervalSlots } from "@/shared/lib/datetime"

export class RelativeCumulativeChart extends RecordChart {
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
        min: rows.length > 0 ? undefined : -10,
        max: rows.length > 0 ? undefined : 10,
      },
      series: [...series],
    }
  }

  hasGroup(): boolean {
    return true
  }
}
