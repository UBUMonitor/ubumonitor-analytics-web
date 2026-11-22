import { m } from "@/paraglide/messages"
import { gradesBoxplotChart } from "@/services/grades/charts/boxplot"
import { gradesRadarChart } from "@/services/grades/charts/radar"
import type { GradesChartParams } from "@/services/grades/charts/shared"
import type { DisplayConfig } from "@/stores/display.svelte"

type ChartDefinition = {
  name: string
  build: (params: GradesChartParams) => Promise<DisplayConfig>
}

export const GRADE_CHARTS = {
  radar: {
    name: m.radar(),
    build: gradesRadarChart,
  },
  boxplot: {
    name: m.boxplot(),
    build: gradesBoxplotChart,
  },
} satisfies Record<string, ChartDefinition>

export type GradeChartKey = keyof typeof GRADE_CHARTS

export function isGradeChartKey(value: string): value is GradeChartKey {
  return Object.hasOwn(GRADE_CHARTS, value)
}
