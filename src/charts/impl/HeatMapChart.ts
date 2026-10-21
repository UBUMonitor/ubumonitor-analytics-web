import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
} from "@/backend/model"
import { CHART_GRID, Chart, type Resolve } from "@/charts/impl/Chart"
import { formatSlot, intervalSlots } from "@/charts/impl/dateUtils"
import { formatTooltip } from "@/charts/impl/utils"
import type { EChartsOption } from "echarts"
import type { CallbackDataParams } from "echarts/types/dist/shared"

type HeatMapDatum = {
  value: [x: number, y: number, count: number]
  fullName: string
  img?: string
}

export class HeatMapChart extends Chart {
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
    scale,
    rows,
  }: Resolve): EChartsOption {
    const range = intervalSlots(interval, startDateTime, endDateTime)

    // Precomputed indices avoid scanning range/userItems for each row (O(n) instead of O(n*m))
    // and let us discard rows that do not match either axis instead of silently plotting -1.
    const dateIndex = new Map(range.map((date, i) => [date, i]))
    const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

    let maxValue = scale

    const data = rows.reduce<HeatMapDatum[]>((acc, row) => {
      const x = dateIndex.get(row.timeBucket!)
      const y = row.user ? userIndex.get(row.user.id) : undefined

      if (x !== undefined && y !== undefined) {
        acc.push({
          value: [x, y, row.value],
          fullName: userItems[y].name,
          img: userItems[y].imageUrl,
        })
      }

      if (row.value > maxValue) maxValue = row.value

      return acc
    }, [])

    return {
      tooltip: {
        formatter: (params) => {
          const p = params as CallbackDataParams
          return formatTooltip(interval, p, (p.data as HeatMapDatum).value[2])
        },
      },
      xAxis: {
        type: "category",
        data: range,
        splitArea: {
          show: true,
        },
        axisLabel: {
          rotate: 45,
          formatter: (value: string) => formatSlot(interval, value),
        },
      },
      yAxis: {
        type: "category",
        data: userItems.map(({ name }) => name),
        inverse: true,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: 0,
        max: Math.ceil(maxValue / 5) * 5,
        precision: 0,
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        top: 8,
      },
      series: {
        type: "heatmap",
        data,
        label: {
          show: true,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
      grid: CHART_GRID,
    }
  }

  hasGroup(): boolean {
    return true
  }

  hasScale(): boolean {
    return true
  }
}
