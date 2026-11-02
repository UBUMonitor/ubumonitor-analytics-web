import type { ECOption } from "@/features/display/impl/echarts"
import { RecordDisplay, type DisplayData, type Resolve } from "@/features/records/RecordDisplay"
import type { RecordType } from "@/features/records/record.svelte"
import { buildLogFilters } from "@/features/records/recordFilters"
import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsResponseRowDto,
} from "@/shared/api/model"
import { queryClient } from "@/shared/api/queryClient"
import { getCourseLogsStatistics } from "@/shared/api/services/course-logs"

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

    const request = {
      fields: this.getFields(selectedInfo),
      timeRange: { from: from.toSeconds(), to: to.toSeconds() },
      interval: this.hasGroup() ? interval : undefined,
      filters: buildLogFilters(selectedInfo, selectedItems, userItems),
    }
    const { rows } = await queryClient.query({
      queryKey: ["courseLogsStatistics", courseId, request],
      queryFn: () => getCourseLogsStatistics(courseId, request),
    })
    return rows
  }
}
