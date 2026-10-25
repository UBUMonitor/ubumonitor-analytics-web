import type { ECOption } from "@/display/impl/echarts"
import type { TableOption } from "@/display/impl/table"
import type { StatsInterval } from "@/shared/lib/datetime"
import { DateTime } from "luxon"

export type DisplayType = "chart" | "table"

export type DisplayOptions = {
  chart: ECOption
  table: TableOption
}

export type DisplayOption = DisplayOptions[DisplayType]

export type DisplayConfig = {
  [K in DisplayType]: {
    type: K
    option: DisplayOptions[K]
  }
}[DisplayType]

export const displayStore = $state({
  displayType: "chart" as DisplayType,
  displayOption: {} as DisplayOption,
  display: [] as string[],
  selectedDisplay: "",
  from: DateTime.now().startOf("year"),
  to: DateTime.now().plus({ day: 1 }).startOf("day"),
  group: "MONTHLY" as StatsInterval,
  scale: 60,
  showScale: false,
  showGroup: false,
})
