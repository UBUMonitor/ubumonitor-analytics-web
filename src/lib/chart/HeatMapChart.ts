import type {
  CourseLogsMetricsRequestDtoFieldsItem,
  CourseLogsMetricsRequestDtoGroupByItem,
} from "@/model"
import type { EChartsOption } from "echarts"
import { Chart, type Resolve } from "./Chart"
import { resolveInterval } from "./utils"

export class HeatMapChart extends Chart {
  getFields(): CourseLogsMetricsRequestDtoFieldsItem[] {
    return ["USER_ID"]
  }

  getGroupBy(): CourseLogsMetricsRequestDtoGroupByItem[] {
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

    // Índices precomputados: evita recorrer range/userItems por cada row (O(n) en vez de O(n*m))
    // y permite descartar filas que no encajan en ningún eje, en vez de pintar -1 silenciosamente.
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
        },
      },
      yAxis: {
        type: "category",
        data: userItems.map(({ name }) => name),
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
