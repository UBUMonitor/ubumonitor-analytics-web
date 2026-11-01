import { recordStore } from "../record.svelte"
import { getCourseLogsList } from "@/backend/services/course-logs"
import type { DisplayConfig } from "@/display/display.svelte"
import type { TableColumn } from "@/display/impl/table"
import { RecordDisplay, type Resolve } from "@/info/record/RecordDisplay"
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
    width: "18%",
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
    key: "module",
    name: m.table_module(),
    filter: true,
    width: "20%",
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
        "USER_ID",
        "COMPONENT_ID",
        "EVENT_ID",
        "MODULE_ID",
        "ORIGIN_ID",
        "IP_ADDRESS",
      ],
    })

    return {
      type: "table",
      option: {
        columns: COLUMNS,
        data: logs.content.map(
          ({ timeCreated, userId, componentId, eventId, moduleId, originId, ip }) => ({
            dateTime: DateTime.fromSeconds(timeCreated),
            user: userMap.get(userId),
            component: componentMap.get(componentId),
            event: eventMap.get(eventId),
            sectionId: moduleMap.get(moduleId)?.sectionName,
            module: moduleMap.get(moduleId)?.name,
            origin: originMap.get(originId),
            ip,
          }),
        ),
      },
    }
  }
}
