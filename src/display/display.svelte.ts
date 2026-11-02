import { DEFAULT_DISPLAY } from "@/display/constants"
import type { ECOption } from "@/display/impl/echarts"
import type { TableOption } from "@/display/impl/table"
import type { StatsInterval } from "@/shared/lib/datetime"
import { DateTime } from "luxon"

export type DisplayConfig =
  { type: "chart"; option: ECOption } | { type: "table"; option: TableOption }

class DisplayStore {
  config = $state.raw<DisplayConfig>({ type: "chart", option: {} })
  selectedDisplay = $state(DEFAULT_DISPLAY)
  from = $state(DateTime.now().startOf("year"))
  to = $state(DateTime.now().plus({ day: 1 }).startOf("day"))
  group = $state<StatsInterval>("MONTHLY")
  scale = $state(60)

  reset() {
    this.config = { type: "chart", option: {} }
    this.selectedDisplay = DEFAULT_DISPLAY
    this.from = DateTime.now().startOf("year")
    this.to = DateTime.now().plus({ day: 1 }).startOf("day")
    this.group = "MONTHLY"
    this.scale = 60
  }
}

export const displayStore = new DisplayStore()
