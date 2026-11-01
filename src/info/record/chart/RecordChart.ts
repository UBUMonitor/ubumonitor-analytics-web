import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import { getCourseLogsStatistics } from "@/backend/services/course-logs"
import type { ECOption } from "@/display/impl/echarts"
import { RecordDisplay, type DisplayData, type Resolve } from "@/info/record/RecordDisplay"
import type { RecordType } from "@/info/record/record.svelte"
import { buildLogFilters } from "@/info/record/recordFilters"

export abstract class RecordChart extends RecordDisplay {
  abstract getFields(selectedInfo: RecordType): CourseLogsStatisticsRequestDtoFieldsItem[]
  abstract buildOptions(rows: CourseLogsStatisticsResponseRowDto[], resolve: Resolve): ECOption

  async fetch(resolve: Resolve): Promise<DisplayData> {
    const rows = await this.requestLogsStatistics(resolve)
    return { kind: "statistics", rows }
  }

  build(data: DisplayData, resolve: Resolve) {
    if (data.kind !== "statistics") throw new Error("Chart display received non-statistics data")
    return { type: "chart", option: this.buildOptions(data.rows, resolve) } as const
  }

  protected async requestLogsStatistics({
    from,
    to,
    interval,
    userItems,
    selectedInfo,
    selectedItems,
    courseId,
  }: Resolve): Promise<CourseLogsStatisticsResponseRowDto[]> {
    if (courseId == null || userItems.length === 0 || selectedItems.length === 0) return []

    const { rows } = await getCourseLogsStatistics(courseId, {
      fields: this.getFields(selectedInfo),
      timeRange: { from: from.toSeconds(), to: to.toSeconds() },
      interval: this.hasGroup() ? interval : undefined,
      filters: buildLogFilters(selectedInfo, selectedItems, userItems),
    })
    return rows
  }
}
