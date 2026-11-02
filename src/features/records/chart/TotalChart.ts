import type { ECOption } from "@/features/display/impl/echarts"
import type { Resolve } from "@/features/records/RecordDisplay"
import { RecordChart } from "@/features/records/chart/RecordChart"
import type { RecordType } from "@/features/records/record.svelte"
import {
  type CourseLogsStatisticsRequestDtoFieldsItem,
  type CourseLogsStatisticsResponseRowDto,
} from "@/shared/api/model"

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

  buildOptions(
    rows: CourseLogsStatisticsResponseRowDto[],
    { selectedInfo, selectedItems }: Resolve,
  ): ECOption {
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
