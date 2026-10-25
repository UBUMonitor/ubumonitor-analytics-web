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
  },
  {
    key: "userFullName",
    name: m.table_name(),
  },
  {
    key: "moduleName",
    name: m.table_module(),
  },
  {
    key: "component",
    name: m.table_component(),
  },
  {
    key: "eventName",
    name: m.table_event(),
  },
  {
    key: "originName",
    name: m.table_origin(),
  },
  {
    key: "ip",
    name: m.table_ip(),
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
    if (userItems.length === 0 || selectedItems.length === 0)
      return { type: "table", option: { columns: COLUMNS, data: [] } }

    const selectedItemsIds = selectedItems.map(({ id }) => id)

    const logs = await getCourseLogsList(courseId, {
      timeRange: { from: from.toUTC().toISO().slice(0, -5), to: to.toUTC().toISO().slice(0, -5) },
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
      pagination: { page: 0, size: 100 },
      sort: [{ field: "TIMESTAMP", direction: "ASC" }],
      includeTotal: true,
    })

    return {
      type: "table",
      option: {
        columns: COLUMNS,
        data: logs.content.map(
          ({ timeCreated, userFullName, moduleName, component, eventName, originName, ip }) => ({
            timeCreated: DateTime.fromISO(timeCreated),
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
