import { BarChart, HeatmapChart, LineChart } from "echarts/charts"
import type { BarSeriesOption, HeatmapSeriesOption, LineSeriesOption } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components"
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([
  BarChart,
  HeatmapChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

// Option type composed only from the registered charts and components
export type ECOption = echarts.ComposeOption<
  | BarSeriesOption
  | HeatmapSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
>

export default echarts
