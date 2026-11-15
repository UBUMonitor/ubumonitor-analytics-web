import type {
  CourseLogsStatisticsRequestDto,
  CourseLogsStatisticsRequestDtoFieldsItem,
  CourseLogsStatisticsRequestFiltersDto,
  CourseLogsStatisticsResponseRowDto,
} from "@/backend/model"
import { getCourseLogStatistics } from "@/backend/services/course-logs"
import type { ItemByType, RecordType, Selection } from "@/stores/records.svelte"
import type { User } from "@/stores/users.svelte"
import type { StatsInterval } from "@/utils/datetime"
import type { DateTime } from "luxon"

export type Row = CourseLogsStatisticsResponseRowDto
export type Field = CourseLogsStatisticsRequestDtoFieldsItem
export type Filters = CourseLogsStatisticsRequestFiltersDto
type AnyItem = ItemByType[RecordType]

export const EMPTY_CHART_MAX_Y = 10

export type ChartParams = Selection & {
  courseId?: number
  from: DateTime<true>
  to: DateTime<true>
  userItems: User[]
  interval: StatsInterval
  scale: number
}

// ---------------------------------------------------------------------------
// Per-record-type strategies
// ---------------------------------------------------------------------------

type Strategy<K extends RecordType> = {
  fields: Field[]
  toFilters: (items: ItemByType[K][]) => Filters
  matches: (row: Row, item: ItemByType[K]) => boolean
}

/** Everything that depends on the record type lives in one place. */
const STRATEGIES: { [K in RecordType]: Strategy<K> } = {
  components: {
    fields: ["COMPONENT_ID"],
    toFilters: (items) => ({ componentIds: items.map(({ id }) => id) }),
    matches: (row, item) => row.component?.id === item.id,
  },
  events: {
    fields: ["COMPONENT_ID", "EVENT_ID"],
    toFilters: (items) => ({
      compositeFilters: items.map(({ event, component }) => ({
        eventId: event.id,
        componentId: component.id,
      })),
    }),
    matches: (row, item) =>
      row.event?.id === item.event.id && row.component?.id === item.component.id,
  },
  sections: {
    fields: ["SECTION_ID"],
    toFilters: (items) => ({ sectionIds: items.map(({ id }) => id) }),
    matches: (row, item) => row.sectionId === item.id,
  },
  modules: {
    fields: ["MODULE_ID"],
    toFilters: (items) => ({ moduleIds: items.map(({ id }) => id) }),
    matches: (row, item) => row.module?.id === item.id,
  },
}

type AnyStrategy = {
  fields: Field[]
  toFilters(items: AnyItem[]): Filters
  matches(row: Row, item: AnyItem): boolean
}

// The only cast: TS cannot correlate a union discriminant with a lookup.
export const getStrategy = (info: RecordType) => STRATEGIES[info] as unknown as AnyStrategy

// ---------------------------------------------------------------------------
// Common request helpers
// ---------------------------------------------------------------------------

/** Returns true when there is nothing to query, so callers can skip the request. */
export function hasNoSelection({ courseId, userItems, selectedItems }: ChartParams): boolean {
  return courseId == null || userItems.length === 0 || selectedItems.length === 0
}

/** Filters shared by every backend request: selected users plus the selected records. */
export function buildFilters({ userItems, selectedInfo, selectedItems }: ChartParams): Filters {
  return {
    userIds: userItems.map(({ id }) => id),
    ...getStrategy(selectedInfo).toFilters(selectedItems),
  }
}

type QueryOptions = {
  fields: Field[]
  /** Only send it when the chart groups rows by time. */
  interval?: StatsInterval
}

export async function requestLogsStatistics(
  params: ChartParams,
  { fields, interval }: QueryOptions,
): Promise<Row[]> {
  if (hasNoSelection(params)) return []

  const { courseId, from, to } = params

  const request: CourseLogsStatisticsRequestDto = {
    fields,
    interval,
    timeRange: { from: from.toSeconds(), to: to.toSeconds() },
    filters: buildFilters(params),
  }

  const { rows } = await getCourseLogStatistics(courseId!, request)
  return rows
}
