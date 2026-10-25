import type { DisplayConfig } from "@/display/display.svelte"
import type { RecordType } from "@/info/record/record.svelte"
import type { StatsInterval } from "@/shared/lib/datetime"
import type { SelectableItem } from "@/shared/types/selectable-item"
import type { UserItem } from "@/user/user.svelte"
import type { DateTime } from "luxon"

export interface Resolve {
  courseId: number
  from: DateTime<true>
  to: DateTime<true>
  interval: StatsInterval
  scale: number
  userItems: UserItem[]
  selectedInfo: RecordType
  selectedItems: SelectableItem[]
}

export abstract class RecordDisplay {
  abstract resolveConfig(resolve: Resolve): Promise<DisplayConfig>

  hasScale() {
    return false
  }

  hasGroup() {
    return false
  }
}
