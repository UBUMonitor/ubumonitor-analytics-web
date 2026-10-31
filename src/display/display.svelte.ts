import type { ECOption } from "@/display/impl/echarts"
import type { TableOption } from "@/display/impl/table"
import type { StatsInterval } from "@/shared/lib/datetime"
import { DateTime } from "luxon"

export type DisplayConfig =
  { type: "chart"; option: ECOption } | { type: "table"; option: TableOption }

export interface DisplayOption {
  value: string
  label: () => string
}

export const displayStore = $state({
  config: { type: "chart", option: {} } as DisplayConfig,
  display: [] as DisplayOption[],
  selectedDisplay: "",
  from: DateTime.now().startOf("year"),
  to: DateTime.now().plus({ day: 1 }).startOf("day"),
  group: "MONTHLY" as StatsInterval,
  scale: 60,
  showScale: false,
  showGroup: false,
})
