import { getLocale } from "@/shared/paraglide/runtime"
import {
  DateTime,
  Interval,
  type DateTimeFormatOptions,
  type DateTimeUnit,
  type WeekdayNumbers,
} from "luxon"

export const StatsInterval = {
  HOURLY: "HOURLY",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  DAY_OF_WEEK: "DAY_OF_WEEK",
} as const

export type StatsInterval = (typeof StatsInterval)[keyof typeof StatsInterval]

const CONFIG: Record<StatsInterval, { unit: DateTimeUnit; format: string }> = {
  HOURLY: { unit: "hour", format: "yyyy-MM-dd'T'HH:00:00" },
  DAILY: { unit: "day", format: "yyyy-MM-dd" },
  WEEKLY: { unit: "week", format: "kkkk-'W'WW" },
  MONTHLY: { unit: "month", format: "yyyy-MM" },
  DAY_OF_WEEK: { unit: "day", format: "E" },
}

export function intervalSlots(
  interval: StatsInterval,
  startDateTime: string,
  endDateTime: string,
): string[] {
  const start = DateTime.fromISO(startDateTime, { zone: "utc" })
  const end = DateTime.fromISO(endDateTime, { zone: "utc" })

  const { unit, format } = CONFIG[interval]

  const slots = Interval.fromDateTimes(start.startOf(unit), end)
    .splitBy({ [unit]: 1 })
    .map((slot) => slot.start!.toFormat(format))

  if (interval === StatsInterval.DAY_OF_WEEK) {
    return [...new Set(slots)].sort()
  }

  return slots
}

const DAY_FORMAT: DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }

const FORMAT_OPTIONS: Record<StatsInterval, DateTimeFormatOptions> = {
  HOURLY: { ...DAY_FORMAT, hour: "numeric", minute: "numeric" },
  DAILY: DAY_FORMAT,
  WEEKLY: DAY_FORMAT, // Monday of the ISO week
  MONTHLY: { month: "short", year: "numeric" },
  DAY_OF_WEEK: { weekday: "long" },
}

const locale = getLocale()

export function formatSlot(interval: StatsInterval, slot: string): string {
  if (interval === StatsInterval.DAY_OF_WEEK) {
    return DateTime.fromObject(
      { weekday: Number(slot) as WeekdayNumbers },
      { zone: "utc", locale },
    ).toLocaleString(FORMAT_OPTIONS.DAY_OF_WEEK)
  }

  return DateTime.fromISO(slot, { zone: "utc", locale }).toLocaleString(FORMAT_OPTIONS[interval])
}
