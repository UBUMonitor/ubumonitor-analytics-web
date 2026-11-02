import type { ECOption } from "@/features/display/impl/echarts"
import { formatTooltip } from "@/features/display/impl/utils"
import type { Resolve } from "@/features/records/RecordDisplay"
import { RecordChart } from "@/features/records/chart/RecordChart"
import type { CourseLogsStatisticsRequestDtoFieldsItem } from "@/shared/api/model"
import type { CourseLogsStatisticsResponseRowDto } from "@/shared/api/model"
import { formatSlot, intervalSlots } from "@/shared/lib/datetime"

type HeatMapDatum = {
  value: [x: number, y: number, count: number]
  fullName: string
  img?: string
}

export class HeatMapChart extends RecordChart {
  getFields(): CourseLogsStatisticsRequestDtoFieldsItem[] {
    return ["USER_ID"]
  }

  buildOptions(
    rows: CourseLogsStatisticsResponseRowDto[],
    { from, to, interval, userItems, scale = 60 }: Resolve,
  ): ECOption {
    const range = intervalSlots(interval, from, to)

    // Precomputed indices avoid scanning range/userItems for each row (O(n) instead of O(n*m))
    // and let us discard rows that do not match either axis instead of silently plotting -1.
    const dateIndex = new Map(range.map((date, i) => [date, i]))
    const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

    let maxValue = scale

    const data = rows.reduce<HeatMapDatum[]>((acc, row) => {
      const x = row.timeBucket ? dateIndex.get(row.timeBucket) : undefined
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
          const currentParams = Array.isArray(params) ? params[0] : params
          const data =
            currentParams &&
            typeof currentParams === "object" &&
            "data" in currentParams &&
            currentParams.data &&
            typeof currentParams.data === "object"
              ? currentParams.data
              : undefined
          const values = data && "value" in data ? data.value : undefined
          const value =
            Array.isArray(values) && typeof values[2] === "number" ? values[2] : undefined
          return formatTooltip(interval, params, value)
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
    }
  }

  hasGroup(): boolean {
    return true
  }

  hasScale(): boolean {
    return true
  }
}
