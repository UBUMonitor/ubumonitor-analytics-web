import { chartStore } from "@/charts/chart.svelte"

export function updateChart(startDate?: string, endDate?: string) {
  if (startDate) {
    chartStore.from = startDate.slice(0, 16)
  } else {
    // Default to 6 months ago if no start date is available
    chartStore.from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  }

  if (endDate) {
    chartStore.to = endDate.slice(0, 16)
  } else {
    // Default to current date if no end date is available
    chartStore.to = new Date().toISOString().slice(0, 16)
  }
}
