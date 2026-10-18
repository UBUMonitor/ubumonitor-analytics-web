import {
  CourseLogsStatisticsRequestDtoFieldsItem,
  type CourseLogsStatisticsRequestDtoGroupByItem,
  type CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import { CHART_GRID, Chart, type Resolve } from "@/charts/impl/Chart"
import type { Info, Item } from "@/dashboard/dashboard.svelte"
import type { EChartsOption } from "echarts"

const FIELDS = {
  section: "SECTION_ID",
  module: "MODULE_ID",
  component: "COMPONENT_ID",
  event: "EVENT_ID",
} as const satisfies Record<Info, CourseLogsStatisticsRequestDtoFieldsItem>

const ITEMS_KEY = {
  section: "sectionItems",
  module: "moduleItems",
  component: "componentItems",
  event: "eventItems",
} as const satisfies Record<Info, keyof Resolve>

const ROW_MATCHER = {
  section: (row: CourseLogsStatisticsResponseRowDto, id: number) => row.sectionId === id,
  module: (row: CourseLogsStatisticsResponseRowDto, id: number) => row.module?.id === id,
  component: (row: CourseLogsStatisticsResponseRowDto, id: number) => row.component?.id === id,
  event: (row: CourseLogsStatisticsResponseRowDto, id: number) => row.event?.id === id,
} as const satisfies Record<Info, (row: CourseLogsStatisticsResponseRowDto, id: number) => boolean>

export class TotalChart extends Chart {
  getFields(): CourseLogsStatisticsRequestDtoFieldsItem[] {
    return [FIELDS[this.selectedInfo]]
  }

  getGroupBy(): CourseLogsStatisticsRequestDtoGroupByItem[] {
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
      grid: CHART_GRID,
    }
  }
}
