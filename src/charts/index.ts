import { chartStore } from "@/charts/chart.svelte"

export function updateChart(startDate?: string, endDate?: string) {
  if (startDate) {
    chartStore.from = startDate.slice(0, 16)
  } else {
    // Default to 6 months ago if no start date is available
    chartStore.from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  }

  const now = new Date()
  const tomorrowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const endTime = endDate ? new Date(endDate).getTime() : tomorrowUTC

  chartStore.to = new Date(Math.min(endTime, tomorrowUTC)).toISOString().slice(0, 16)
}
