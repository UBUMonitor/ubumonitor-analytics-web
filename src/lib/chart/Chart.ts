import type {
  CourseLogsMetricsRequestDtoFieldsItem,
  CourseLogsMetricsRequestDtoGroupByItem,
  CourseLogsMetricsRequestDtoInterval,
  CourseLogsMetricsResponseRowDto,
} from "@/model"
import type { EChartsOption } from "echarts"
import type { Info, ModuleItem, SectionItem, UserItem } from "../appStore.svelte"

export interface Resolve {
  userItems: UserItem[]
  sectionItems: SectionItem[]
  moduleItems: ModuleItem[]
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
