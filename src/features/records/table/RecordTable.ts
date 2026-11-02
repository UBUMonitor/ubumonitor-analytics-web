import type { DisplayConfig } from "@/features/display/display.svelte"
import type { TableColumn } from "@/features/display/impl/table"
import { RecordDisplay, type DisplayData, type Resolve } from "@/features/records/RecordDisplay"
import { recordStore } from "@/features/records/record.svelte"
import { buildLogFilters } from "@/features/records/recordFilters"
import type { CourseLogsListRequestDto } from "@/shared/api/model"
import { queryClient } from "@/shared/api/queryClient"
import { getCourseLogsList } from "@/shared/api/services/course-logs"
import { m } from "@/shared/paraglide/messages"
import { DateTime } from "luxon"

const COLUMNS = [
  {
    key: "dateTime",
    name: m.table_date_time(),
    type: "date",
    width: "12%",
  },
  {
    key: "user",
    name: m.table_name(),
    filter: true,
    width: "14%",
  },
  {
    key: "component",
    name: m.table_component(),
    filter: true,
    width: "10%",
  },
  {
    key: "event",
    name: m.table_event(),
    filter: true,
    width: "20%",
  },
  {
    key: "section",
    name: m.table_section(),
    filter: true,
    width: "14%",
  },
  {
    key: "module",
    name: m.table_module(),
    filter: true,
    width: "15%",
  },
  {
    key: "origin",
    name: m.table_origin(),
    filter: true,
    width: "5%",
  },
  {
    key: "ip",
    name: m.table_ip(),
    filter: true,
    width: "10%",
  },
] as const satisfies TableColumn[]

export class RecordTable extends RecordDisplay {
  async fetch({
    courseId,
    from,
    to,
    userItems,
    selectedInfo,
    selectedItems,
  }: Resolve): Promise<DisplayData> {
    if (courseId == null || userItems.length === 0 || selectedItems.length === 0) {
      return { kind: "table", entries: [] }
    }

    const request = {
      timeRange: { from: from.toSeconds(), to: to.toSeconds() },
      filters: buildLogFilters(selectedInfo, selectedItems, userItems),
      fields: [
        "TIMESTAMP",
        "USER_ID",
        "COMPONENT_ID",
        "EVENT_ID",
        "MODULE_ID",
        "ORIGIN_ID",
        "IP_ADDRESS",
      ],
    } satisfies CourseLogsListRequestDto
    const logs = await queryClient.query({
      queryKey: ["courseLogsList", courseId, request],
      queryFn: () => getCourseLogsList(courseId, request),
    })

    return { kind: "table", entries: logs.content }
  }

  build(data: DisplayData, { userItems }: Resolve): DisplayConfig {
    if (data.kind !== "table") throw new Error("Table display received non-table data")

    const userMap = new Map(userItems.map(({ id, name }) => [id, name]))
    const componentMap = new Map(recordStore.componentItems.map(({ id, name }) => [id, name]))
    const eventMap = new Map(recordStore.eventItems.map(({ id, name }) => [id, name]))
    const sectionMap = new Map(recordStore.sectionItems.map(({ id, name }) => [id, name]))
    const moduleMap = new Map(
      recordStore.moduleItems.map(({ id, name, sectionId }) => [
        id,
        { name, sectionName: sectionMap.get(sectionId) },
      ]),
    )
    const originMap = new Map(recordStore.originItems.map(({ id, name }) => [id, name]))

    return {
      type: "table",
      option: {
        columns: COLUMNS,
        data: data.entries.map(
          ({ timeCreated, userId, componentId, eventId, moduleId, originId, ip }) => ({
            dateTime: DateTime.fromSeconds(timeCreated),
            user: userMap.get(userId),
            component: componentMap.get(componentId),
            event: eventMap.get(eventId),
            section: moduleMap.get(moduleId)?.sectionName,
            module: moduleMap.get(moduleId)?.name,
            origin: originMap.get(originId),
            ip,
          }),
        ),
      },
    }
  }
}
