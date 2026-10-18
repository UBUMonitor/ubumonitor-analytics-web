import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
} from "@/backend/model"
import { Chart, type Resolve } from "@/charts/impl/Chart"
import { formatIntervalLabel, resolveInterval } from "@/charts/impl/utils"
import type { EChartsOption } from "echarts"

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
    const range = resolveInterval(interval, startDateTime, endDateTime)

    // Precomputed indices avoid scanning range/userItems for each row (O(n) instead of O(n*m))
    // and let us discard rows that do not match either axis instead of silently plotting -1.
    const dateIndex = new Map(range.map((date, i) => [date, i]))
    const userIndex = new Map(userItems.map((user, i) => [user.id, i]))

    const data = rows.reduce<[number, number, number][]>((acc, row) => {
      const x = dateIndex.get(row.timeBucket!)
      const y = row.user ? userIndex.get(row.user.id) : undefined

      if (x !== undefined && y !== undefined) {
        acc.push([x, y, row.value!])
      }

      return acc
    }, [])

    return {
      tooltip: {
        position: "top",
      },
      xAxis: {
        type: "category",
        data: range,
        splitArea: {
          show: true,
        },
        axisLabel: {
          rotate: 45,
          formatter: (value: string) => formatIntervalLabel(value, interval),
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
        max: scale,
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        top: 8,
      },
      series: [
        {
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
      ],
      grid: {
        right: 16,
        bottom: 16,
        left: 16,
        containLabel: true,
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
