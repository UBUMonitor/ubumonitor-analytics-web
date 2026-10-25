import { getLocale } from "@/shared/paraglide/runtime"
import { tableFeatures } from "@tanstack/svelte-table"
import { DateTime } from "luxon"

export type DynamicRow = Record<string, unknown>

export type DataType = "string" | "number" | "boolean" | "date"

export interface TableColumn {
  key: string
  name: string
  type?: DataType
}

export interface TableOption {
  columns: TableColumn[]
  data: DynamicRow[]
}

export const features = tableFeatures({})

export function renderValue(value: unknown, dataType?: DataType) {
  if (value == null) return ""
  if (dataType === "date")
    return (value as DateTime).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
  if (dataType === "boolean") return (value as boolean) ? "✅" : "❌"
  if (dataType === "number") return Intl.NumberFormat(getLocale()).format(value as number)
  return String(value)
}
