import type { CourseLogsStatisticsRequestDtoInterval } from "@/backend/model"

export const chartStore = $state({
  from: "2026-01-01T02:00",
  to: "2026-12-31T23:59:59",
  group: "MONTHLY" as CourseLogsStatisticsRequestDtoInterval,
  scale: 60,
})
