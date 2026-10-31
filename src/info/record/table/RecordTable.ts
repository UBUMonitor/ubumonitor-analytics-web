import { getCourseLogsList } from "@/backend/services/course-logs"
import type { DisplayConfig } from "@/display/display.svelte"
import type { TableColumn } from "@/display/impl/table"
import { RecordDisplay, type Resolve } from "@/info/record/RecordDisplay"
import { m } from "@/shared/paraglide/messages"
import { DateTime } from "luxon"

const COLUMNS = [
  {
    key: "timeCreated",
    name: m.table_date_time(),
    type: "date",
    width: "12%",
  },
  {
    key: "userFullName",
    name: m.table_name(),
    filter: true,
    width: "18%",
  },
  {
    key: "moduleName",
    name: m.table_module(),
    filter: true,
    width: "20%",
  },
  {
    key: "component",
    name: m.table_component(),
    filter: true,
    width: "10%",
  },
  {
    key: "eventName",
    name: m.table_event(),
    filter: true,
    width: "20%",
  },
  {
    key: "originName",
    name: m.table_origin(),
    filter: true,
    width: "5%",
  },
  {
    key: "ip",
    name: m.table_ip(),
    filter: true,
    width: "15%",
  },
] as const satisfies TableColumn[]

export class RecordTable extends RecordDisplay {
  async resolveConfig({
    courseId,
    from,
    to,
    userItems,
    selectedInfo,
    selectedItems,
  }: Resolve): Promise<DisplayConfig> {
    if (courseId == null || userItems.length === 0 || selectedItems.length === 0)
      return { type: "table", option: { columns: COLUMNS, data: [] } }

    const selectedItemsIds = selectedItems.map(({ id }) => id)

    const logs = await getCourseLogsList(courseId, {
      timeRange: { from: from.toSeconds(), to: to.toSeconds() },
      filters: {
        userIds: userItems.map(({ id }) => id),
        moduleIds: selectedInfo === "module" ? selectedItemsIds : undefined,
        sectionIds: selectedInfo === "section" ? selectedItemsIds : undefined,
        componentIds: selectedInfo === "component" ? selectedItemsIds : undefined,
        eventIds: selectedInfo === "event" ? selectedItemsIds : undefined,
      },
      fields: [
        "TIMESTAMP",
        "USER_FULL_NAME",
        "MODULE_NAME",
        "COMPONENT_NAME",
        "EVENT_NAME",
        "ORIGIN_NAME",
        "IP_ADDRESS",
      ],
      pagination: { page: 0, size: 10_000 },
      sort: [{ field: "TIMESTAMP", direction: "ASC" }],
      includeTotal: true,
    })

    return {
      type: "table",
      option: {
        columns: COLUMNS,
        data: logs.content.map(
          ({ timeCreated, userFullName, moduleName, component, eventName, originName, ip }) => ({
            timeCreated: DateTime.fromSeconds(timeCreated),
            userFullName,
            moduleName,
            component,
            eventName,
            originName,
            ip,
          }),
        ),
      },
    }
  }
}
