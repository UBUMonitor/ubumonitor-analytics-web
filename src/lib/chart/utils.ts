import type { CourseLogsMetricsRequestDtoInterval } from "@/model"

const MS_PER_DAY = 86_400_000
const MS_PER_WEEK = MS_PER_DAY * 7

const INTERVALS = new Map<
  CourseLogsMetricsRequestDtoInterval,
  (startDateTime: string, endDateTime: string) => string[]
>()

INTERVALS.set("HOURLY", getHourRange)
INTERVALS.set("DAILY", getDateRange)
INTERVALS.set("WEEKLY", getWeekRange)
INTERVALS.set("MONTHLY", getMonthRange)
INTERVALS.set("DAY_OF_WEEK", () => ["1", "2", "3", "4", "5", "6", "7"])

export function resolveInterval(
  interval: CourseLogsMetricsRequestDtoInterval,
  startDateTime: string,
  endDateTime: string,
) {
  return INTERVALS.get(interval)!(startDateTime, endDateTime)
}

function getHourRange(startDateTime: string, endDateTime: string): string[] {
  const startTs = new Date(startDateTime).getTime()
  const endTs = new Date(endDateTime).getTime()

  const MS_PER_HOUR = 3_600_000
  const count = Math.floor((endTs - startTs) / MS_PER_HOUR) + 1

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startTs + i * MS_PER_HOUR)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    const hh = String(d.getUTCHours()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}T${hh}:00:00`
  })
}

function getDateRange(startDateTime: string, endDateTime: string): string[] {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  const startTs = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endTs = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

  const count = Math.floor((endTs - startTs) / MS_PER_DAY) + 1

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startTs + i * MS_PER_DAY)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(d.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  })
}

function getISOWeek(ts: number): { year: number; week: number } {
  const d = new Date(ts)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / MS_PER_DAY + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

function getWeekRange(startDateTime: string, endDateTime: string): string[] {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  const startMondayTs =
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) -
    ((start.getDay() + 6) % 7) * MS_PER_DAY
  const endTs = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())

  const count = Math.floor((endTs - startMondayTs) / MS_PER_WEEK) + 1

  return Array.from({ length: count }, (_, i) => {
    const { year, week } = getISOWeek(startMondayTs + i * MS_PER_WEEK)
    return `${year}-W${String(week).padStart(2, "0")}`
  })
}

function getMonthRange(startDateTime: string, endDateTime: string): string[] {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)

  const startYear = start.getFullYear()
  const startMonth = start.getMonth()
  const endYear = end.getFullYear()
  const endMonth = end.getMonth()

  const count = (endYear - startYear) * 12 + (endMonth - startMonth) + 1

  return Array.from({ length: count }, (_, i) => {
    const totalMonths = startMonth + i
    const yyyy = startYear + Math.floor(totalMonths / 12)
    const mm = String((totalMonths % 12) + 1).padStart(2, "0")
    return `${yyyy}-${mm}`
  })
}
