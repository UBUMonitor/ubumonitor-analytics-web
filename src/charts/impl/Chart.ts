import type {
  CourseLogsMetricsRequestDtoFieldsItem,
  CourseLogsMetricsRequestDtoGroupByItem,
  CourseLogsMetricsRequestDtoInterval,
  CourseLogsMetricsResponseRowDto,
} from "@/backend/model"
import type { Info, Item, ModuleItem, SectionItem, UserItem } from "@/dashboard/dashboard.svelte"
import type { EChartsOption } from "echarts"

export interface Resolve {
  userItems: UserItem[]
  sectionItems: SectionItem[]
  moduleItems: ModuleItem[]
  componentItems: Item[]
  eventItems: Item[]
  startDateTime: string
  endDateTime: string
  interval: CourseLogsMetricsRequestDtoInterval
  scale: number
  rows: CourseLogsMetricsResponseRowDto[]
}

export abstract class Chart {
  protected selectedInfo: Info = "section"

  abstract getFields(): CourseLogsMetricsRequestDtoFieldsItem[]
  abstract getGroupBy(): CourseLogsMetricsRequestDtoGroupByItem[]
  abstract resolveOptions(resolve: Resolve): EChartsOption

  setSelectedInfo(info: Info) {
    this.selectedInfo = info
  }

  hasScale() {
    return false
  }

  hasGroup() {
    return false
  }
}
