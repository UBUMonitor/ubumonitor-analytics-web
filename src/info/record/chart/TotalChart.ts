import {
  CourseLogsStatisticsRequestDtoFieldsItem,
  type CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import type { ECOption } from "@/display/impl/echarts"
import type { Resolve } from "@/info/record/RecordDisplay"
import { RecordChart } from "@/info/record/chart/RecordChart"
import type { RecordType } from "@/info/record/record.svelte"

const FIELDS = {
  section: "SECTION_ID",
  module: "MODULE_ID",
  component: "COMPONENT_ID",
  event: "EVENT_ID",
} as const satisfies Record<RecordType, CourseLogsStatisticsRequestDtoFieldsItem>

const ROW_MATCHER = {
  section: (row, id) => row.sectionId === id,
  module: (row, id) => row.module?.id === id,
  component: (row, id) => row.component?.id === id,
  event: (row, id) => row.event?.id === id,
} as const satisfies Record<
  RecordType,
  (row: CourseLogsStatisticsResponseRowDto, id: number) => boolean
>

export class TotalChart extends RecordChart {
  getFields(selectedInfo: RecordType): CourseLogsStatisticsRequestDtoFieldsItem[] {
    return [FIELDS[selectedInfo]]
  }

  async resolveOptions({
    courseId,
    from,
    to,
    interval,
    userItems,
    selectedInfo,
    selectedItems,
  }: Resolve): Promise<ECOption> {
    const rows = await this.requestLogsStatistics(
      from,
      to,
      interval,
      userItems,
      selectedInfo,
      selectedItems,
      courseId,
    )

    const matcher = ROW_MATCHER[selectedInfo]
    const data = selectedItems.map((item) => rows.find((row) => matcher(row, item.id))?.value ?? 0)

    return {
      xAxis: {
        type: "category",
        data: selectedItems.map(({ name }) => name),
        axisLabel: {
          interval: 0,
          overflow: "truncate",
          width: 200,
          rotate: 45,
        },
      },
      yAxis: { type: "value", min: 0, max: rows.length > 0 ? undefined : 10 },
      series: [
        {
          type: "bar",
          data,
        },
      ],
      tooltip: {},
    }
  }
}
