import type { ChartParams } from "./shared"
import { m } from "@/paraglide/messages"
import { recordsCumulativeChart } from "@/services/records/charts/cumulative"
import { recordsHeatmapChart } from "@/services/records/charts/heatmap"
import { recordsRelativeCumulativeChart } from "@/services/records/charts/relativeCumulative"
import { recordsTotalChart } from "@/services/records/charts/total"
import { recordsTableChart } from "@/services/records/table"
import type { DisplayConfig } from "@/stores/display.svelte"

export type { ChartParams } from "./shared"

type ChartDefinition = {
  name: string
  showScale: boolean
  showInterval: boolean
  build: (params: ChartParams) => Promise<DisplayConfig>
}

export const RECORD_CHARTS = {
  total: {
    name: m.total(),
    showScale: false,
    showInterval: false,
    build: recordsTotalChart,
  },
  heatmap: {
    name: m.heatmap(),
    showScale: true,
    showInterval: true,
    build: recordsHeatmapChart,
  },
  cumulative: {
    name: m.cumulative(),
    showScale: false,
    showInterval: true,
    build: recordsCumulativeChart,
  },
  relativeCumulative: {
    name: m.relative_cumulative(),
    showScale: false,
    showInterval: true,
    build: recordsRelativeCumulativeChart,
  },
  table: {
    name: m.table(),
    showScale: false,
    showInterval: false,
    build: recordsTableChart,
  },
} satisfies Record<string, ChartDefinition>

export type RecordChartKey = keyof typeof RECORD_CHARTS

export function isRecordChartKey(value: string): value is RecordChartKey {
  return Object.hasOwn(RECORD_CHARTS, value)
}
