import type { ECOption } from "@/services/display/echarts"
import { basicTooltip, round2 } from "@/services/display/utils"
import type { ChartParams, Row } from "@/services/records/shared"
import type { User } from "@/stores/users.svelte"
import { formatSlot, intervalSlots, type StatsInterval } from "@/utils/datetime"
import type { CallbackDataParams } from "echarts/types/src/util/types.js"

type Slots = ReturnType<typeof intervalSlots>

export type CumulativeData = {
  range: Slots
  rangeLength: number
  matrix: Float64Array
  columnMean: number[]
}

type UserDatum = {
  value: number
  fullName: string
  img: string
}

export function buildCumulativeData(rows: Row[], params: ChartParams): CumulativeData {
  const { from, to, interval, userItems } = params
  const range = intervalSlots(interval, from, to)
  const rangeLength = range.length
  const userCount = userItems.length

  const dateIndex = new Map(range.map((date, i) => [date, i]))
  const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

  const matrix = new Float64Array(userCount * rangeLength)

  for (const row of rows) {
    if (!row.timeBucket || !row.user) continue

    const dateIdx = dateIndex.get(row.timeBucket)
    const userIdx = userIndex.get(row.user.id)

    if (dateIdx === undefined || userIdx === undefined) continue

    matrix[userIdx * rangeLength + dateIdx] = row.value
  }

  const columnMean = new Array<number>(rangeLength)
  const runningTotals = new Float64Array(userCount)

  for (let t = 0; t < rangeLength; t++) {
    let columnSum = 0

    for (let u = 0; u < userCount; u++) {
      const idx = u * rangeLength + t
      runningTotals[u] += matrix[idx]
      matrix[idx] = runningTotals[u]
      columnSum += runningTotals[u]
    }

    columnMean[t] = userCount > 0 ? round2(columnSum / userCount) : 0
  }

  return { range, rangeLength, matrix, columnMean }
}

export function buildUserSeries(
  userItems: User[],
  { matrix, rangeLength }: CumulativeData,
  transform: (value: number, timeIndex: number) => number = (value) => value,
) {
  return userItems.map((user, u) => ({
    name: user.name,
    type: "line" as const,
    data: Array.from(
      matrix.subarray(u * rangeLength, (u + 1) * rangeLength),
      (value, t) =>
        ({
          value: transform(value, t),
          fullName: user.name,
          img: user.imageUrl,
        }) satisfies UserDatum,
    ),
  }))
}

export function lineChartBase(interval: StatsInterval, range: Slots): ECOption {
  return {
    tooltip: {
      formatter: (tooltipParams) => {
        const p = tooltipParams as CallbackDataParams
        const { fullName, img, value } = p.data as UserDatum
        return basicTooltip({
          userName: fullName,
          img,
          value,
          name: formatSlot(interval, p.name),
          marker: p.marker,
        })
      },
    },
    legend: { type: "scroll" as const, top: "top" as const, left: "center" as const },
    xAxis: {
      type: "category" as const,
      boundaryGap: false,
      data: range,
      axisLabel: { formatter: (value: string) => formatSlot(interval, value) },
    },
  }
}
