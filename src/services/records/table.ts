import type { CourseLogsListRequestDto } from "@/backend/model"
import { searchCourseLogs } from "@/backend/services/course-logs"
import { m } from "@/paraglide/messages"
import type { TableColumn } from "@/services/display/table"
import { buildFilters, hasNoSelection, type ChartParams } from "@/services/records/shared"
import type { DisplayConfig } from "@/stores/display.svelte"
import { recordsStore } from "@/stores/records.svelte"
import { usersStore } from "@/stores/users.svelte"
import { DateTime } from "luxon"

const TABLE_COLUMNS = [
  { key: "dateTime", name: m.table_date_time(), type: "date", width: "12%" },
  { key: "user", name: m.table_name(), filter: true, width: "14%" },
  { key: "component", name: m.table_component(), filter: true, width: "10%" },
  { key: "event", name: m.table_event(), filter: true, width: "20%" },
  { key: "section", name: m.table_section(), filter: true, width: "14%" },
  { key: "module", name: m.table_module(), filter: true, width: "15%" },
  { key: "origin", name: m.table_origin(), filter: true, width: "5%" },
  { key: "ip", name: m.table_ip(), filter: true, width: "10%" },
] as const satisfies TableColumn[]

async function requestLogsList(params: ChartParams) {
  if (hasNoSelection(params)) return []

  const { courseId, from, to } = params

  const request: CourseLogsListRequestDto = {
    timeRange: { from: from.toSeconds(), to: to.toSeconds() },
    filters: buildFilters(params),
    fields: [
      "TIMESTAMP",
      "USER_ID",
      "COMPONENT_ID",
      "EVENT_ID",
      "MODULE_ID",
      "ORIGIN_ID",
      "IP_ADDRESS",
    ],
  }

  const { content } = await searchCourseLogs(courseId!, request)
  return content
}

export async function recordsTableChart(params: ChartParams): Promise<DisplayConfig> {
  const entries = await requestLogsList(params)

  return {
    type: "table",
    option: {
      columns: TABLE_COLUMNS,
      data: entries.map(
        ({ timeCreated, userId, componentId, eventId, moduleId, originId, ip }) => ({
          dateTime: DateTime.fromSeconds(timeCreated),
          user: usersStore.usersMap.get(userId)?.name,
          component: recordsStore.componentsMap.get(componentId)?.name,
          event: recordsStore.eventsMap.get(eventId)?.name,
          section: recordsStore.getSectionByModule(moduleId)?.name,
          module: recordsStore.modulesMap.get(moduleId)?.name,
          origin: recordsStore.originsMap.get(originId)?.name,
          ip: ip,
        }),
      ),
    },
  }
}
