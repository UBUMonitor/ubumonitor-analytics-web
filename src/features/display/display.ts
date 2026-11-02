import { defaultDisplayTo, displayStore } from "@/features/display/display.svelte"
import { DateTime } from "luxon"

export function updateChartDate(startDate?: DateTime<true>, endDate?: DateTime<true>) {
  const now = DateTime.now()
  displayStore.from = startDate ?? now.minus({ months: 6 }).startOf("day")
  const defaultTo = defaultDisplayTo(now)
  displayStore.to = endDate && endDate < defaultTo ? endDate : defaultTo
}
