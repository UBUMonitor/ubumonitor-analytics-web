import { displayStore } from "@/display/display.svelte"
import { DateTime } from "luxon"

export function updateChartDate(startDate?: DateTime<true>, endDate?: DateTime<true>) {
  const now = DateTime.now()
  const tomorrow = now.plus({ days: 1 }).startOf("day")

  displayStore.from = startDate ?? now.minus({ months: 6 }).startOf("day")
  displayStore.to = endDate && endDate < tomorrow ? endDate : tomorrow
}
