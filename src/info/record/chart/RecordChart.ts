import type {
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestDtoGroupByItem,
  CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import { getCourseLogsStatistics } from "@/backend/services/course-logs"
import type { DisplayConfig } from "@/display/display.svelte"
import type { ECOption } from "@/display/impl/echarts"
import { RecordDisplay, type Resolve } from "@/info/record/RecordDisplay"
import type { RecordType } from "@/info/record/record.svelte"
import type { StatsInterval } from "@/shared/lib/datetime"
import type { SelectableItem } from "@/shared/types/selectable-item"
import type { UserItem } from "@/user/user.svelte"
import type { DateTime } from "luxon"

export abstract class RecordChart extends RecordDisplay {
  abstract getFields(selectedInfo: RecordType): CourseLogsStatisticsRequestDtoFieldsItem[]
  abstract getGroupBy(selectedInfo: RecordType): CourseLogsStatisticsRequestDtoGroupByItem[]
  abstract resolveOptions(resolve: Resolve): Promise<ECOption>

  async resolveConfig(resolve: Resolve): Promise<DisplayConfig> {
    return this.resolveOptions(resolve).then((option) => ({ type: "chart", option }))
  }

  protected async requestLogsStatistics(
    courseId: number,
    from: DateTime<true>,
    to: DateTime<true>,
    interval: StatsInterval,
    userItems: UserItem[],
    selectedInfo: RecordType,
    selectedItems: SelectableItem[],
  ): Promise<CourseLogsStatisticsResponseRowDto[]> {
    if (userItems.length === 0 || selectedItems.length === 0) return Promise.resolve([])

    const selectedItemsIds = selectedItems.map(({ id }) => id)

    return getCourseLogsStatistics(courseId, {
      fields: this.getFields(selectedInfo),
      groupBy: this.getGroupBy(selectedInfo),
      timeRange: { from: from.toUTC().toISO().slice(0, -5), to: to.toUTC().toISO().slice(0, -5) },
      interval: this.hasGroup() ? interval : undefined,
      filters: {
        userIds: userItems.map(({ id }) => id),
        moduleIds: selectedInfo === "module" ? selectedItemsIds : undefined,
        sectionIds: selectedInfo === "section" ? selectedItemsIds : undefined,
        componentIds: selectedInfo === "component" ? selectedItemsIds : undefined,
        eventIds: selectedInfo === "event" ? selectedItemsIds : undefined,
      },
    }).then(({ rows }) => rows)
  }
}
