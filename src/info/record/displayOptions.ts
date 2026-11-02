import type { RecordDisplay } from "@/info/record/RecordDisplay"
import { CumulativeChart } from "@/info/record/chart/CumulativeChart"
import { HeatMapChart } from "@/info/record/chart/HeatMapChart"
import { RelativeCumulativeChart } from "@/info/record/chart/RelativeCumulativeChart"
import { TotalChart } from "@/info/record/chart/TotalChart"
import { RecordTable } from "@/info/record/table/RecordTable"
import { m } from "@/shared/paraglide/messages"

export const displayOptions = [
  { value: "total", label: m.total, display: new TotalChart() },
  { value: "heatmap", label: m.heatmap, display: new HeatMapChart() },
  { value: "cumulative", label: m.cumulative, display: new CumulativeChart() },
  {
    value: "relative_cumulative",
    label: m.relative_cumulative,
    display: new RelativeCumulativeChart(),
  },
  { value: "table", label: m.table, display: new RecordTable() },
] satisfies { value: string; label: () => string; display: RecordDisplay }[]

export function getDisplayOption(value: string) {
  return displayOptions.find((option) => option.value === value)
}
