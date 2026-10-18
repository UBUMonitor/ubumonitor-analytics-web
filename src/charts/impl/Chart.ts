import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
  CourseLogsStatisticsRequestDtoInterval,
  CourseLogsStatisticsResponseRowDto,
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
  interval: CourseLogsStatisticsRequestDtoInterval
  scale: number
  rows: CourseLogsStatisticsResponseRowDto[]
}

export abstract class Chart {
  protected selectedInfo: Info = "component"

  abstract getFields(): CourseLogsStatisticsRequestDtoFieldsItem[]
  abstract getGroupBy(): CourseLogsStatisticsRequestDtoGroupByItem[]
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
