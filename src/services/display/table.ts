import { numberFormat } from "@/utils/i18n"
import {
  columnFacetingFeature,
  columnFilteringFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  metaHelper,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from "@tanstack/svelte-table"
import { DateTime } from "luxon"
import type { Component } from "svelte"

export type DynamicRow = Record<string, unknown>

export type DataType = "string" | "number" | "boolean" | "date"

export interface CellProps {
  value: unknown
  row: DynamicRow
}

export interface TableColumn {
  key: string
  name: string
  type?: DataType
  filter?: boolean
  width?: string
  component?: Component<CellProps>
}

export interface TableOption {
  columns: TableColumn[]
  data: DynamicRow[]
}

interface ColumnMeta {
  dataType?: DataType
  width?: string
  custom?: boolean
}

export const features = tableFeatures({
  columnMeta: metaHelper<ColumnMeta>(),
  rowSortingFeature,
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
})

export function renderValue(value: unknown, dataType?: DataType) {
  if (value == null) return ""
  if (dataType === "date")
    return (value as DateTime).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
  if (dataType === "boolean") return (value as boolean) ? "✅" : "❌"
  if (dataType === "number") return numberFormat(value as number)
  return String(value)
}
