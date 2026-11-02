import { DEFAULT_DISPLAY } from "@/features/display/constants"
import type { ECOption } from "@/features/display/impl/echarts"
import type { TableOption } from "@/features/display/impl/table"
import type { StatsInterval } from "@/shared/lib/datetime"
import { DateTime } from "luxon"

export type DisplayConfig =
  { type: "chart"; option: ECOption } | { type: "table"; option: TableOption }

export function defaultDisplayTo(now = DateTime.now()) {
  return now.plus({ day: 1 }).startOf("day")
}

function defaults() {
  return {
    config: { type: "chart", option: {} } as DisplayConfig,
    from: DateTime.now().startOf("year"),
    to: defaultDisplayTo(),
    group: "MONTHLY" as StatsInterval,
    scale: 60,
  }
}

class DisplayStore {
  config = $state.raw<DisplayConfig>(initialDefaults.config)
  selectedDisplay = $state(DEFAULT_DISPLAY)
  from = $state(initialDefaults.from)
  to = $state(initialDefaults.to)
  group = $state<StatsInterval>(initialDefaults.group)
  scale = $state(initialDefaults.scale)

  reset() {
    const values = defaults()
    this.config = values.config
    this.selectedDisplay = DEFAULT_DISPLAY
    this.from = values.from
    this.to = values.to
    this.group = values.group
    this.scale = values.scale
  }
}

const initialDefaults = defaults()

export const displayStore = new DisplayStore()
