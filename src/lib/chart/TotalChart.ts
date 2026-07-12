import {
  CourseLogsMetricsRequestDtoFieldsItem,
  type CourseLogsMetricsRequestDtoGroupByItem,
  type CourseLogsMetricsResponseRowDto,
} from "@/model"
import type { EChartsOption } from "echarts"
import type { Info, Item } from "../appStore.svelte"
import { Chart, type Resolve } from "./Chart"

const FIELDS = {
  section: "SECTION_ID",
  module: "MODULE_ID",
} as const satisfies Record<Info, CourseLogsMetricsRequestDtoFieldsItem>

const ITEMS_KEY = {
  section: "sectionItems",
  module: "moduleItems",
} as const satisfies Record<Info, keyof Resolve>

const ROW_MATCHER = {
  section: (row: CourseLogsMetricsResponseRowDto, id: number) => row.sectionId === id,
  module: (row: CourseLogsMetricsResponseRowDto, id: number) => row.module?.id === id,
} as const satisfies Record<Info, (row: CourseLogsMetricsResponseRowDto, id: number) => boolean>

export class TotalChart extends Chart {
  getFields(): CourseLogsMetricsRequestDtoFieldsItem[] {
    return [FIELDS[this.selectedInfo]]
  }

  getGroupBy(): CourseLogsMetricsRequestDtoGroupByItem[] {
    return [FIELDS[this.selectedInfo]]
  }

  resolveOptions(resolve: Resolve): EChartsOption {
    const items = resolve[ITEMS_KEY[this.selectedInfo]] as Item[]
    const matcher = ROW_MATCHER[this.selectedInfo]
    const data = items.map((item) => resolve.rows.find((row) => matcher(row, item.id))?.value ?? 0)

    return {
      xAxis: {
        type: "category",
        data: items.map(({ name }) => name),
        axisLabel: {
          interval: 0,
          overflow: "truncate",
          width: 200,
          rotate: 45,
        },
      },
      yAxis: { type: "value", min: 0, max: resolve.rows.length > 0 ? undefined : 10 },
      series: [
        {
          type: "bar",
          data,
        },
      ],
      tooltip: {
        trigger: "item",
      },
      grid: {
        right: 16,
        bottom: 16,
        left: 16,
        containLabel: true,
      },
    }
  }
}
