import type { LogEntryDto, CourseLogsStatisticsResponseRowDto } from "@/backend/model"
import type { DisplayConfig } from "@/display/display.svelte"
import type { RecordType } from "@/info/record/record.svelte"
import type { StatsInterval } from "@/shared/lib/datetime"
import type { SelectableItem } from "@/shared/types/selectable-item"
import type { UserItem } from "@/user/user.svelte"
import type { DateTime } from "luxon"

export type DisplayData =
  | { kind: "statistics"; rows: CourseLogsStatisticsResponseRowDto[] }
  | { kind: "table"; entries: LogEntryDto[] }

export interface Resolve {
  courseId?: number
  from: DateTime<true>
  to: DateTime<true>
  interval: StatsInterval
  scale?: number
  userItems: UserItem[]
  selectedInfo: RecordType
  selectedItems: SelectableItem[]
}

export abstract class RecordDisplay {
  abstract fetch(resolve: Resolve): Promise<DisplayData>
  abstract build(data: DisplayData, resolve: Resolve): DisplayConfig

  async resolveConfig(resolve: Resolve): Promise<DisplayConfig> {
    return this.build(await this.fetch(resolve), resolve)
  }

  hasScale() {
    return false
  }

  hasGroup() {
    return false
  }
}
