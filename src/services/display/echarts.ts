import type { DatasetComponentOption } from "echarts"
import type {
  BarSeriesOption,
  BoxplotSeriesOption,
  HeatmapSeriesOption,
  LineSeriesOption,
  RadarSeriesOption,
  ScatterSeriesOption,
} from "echarts/charts"
import {
  BarChart,
  BoxplotChart,
  HeatmapChart,
  LineChart,
  RadarChart,
  ScatterChart,
} from "echarts/charts"
import type {
  GridComponentOption,
  LegendComponentOption,
  RadarComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from "echarts/components"
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([
  BarChart,
  BoxplotChart,
  HeatmapChart,
  LineChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  DatasetComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

export type ECOption = echarts.ComposeOption<
  | BarSeriesOption
  | BoxplotSeriesOption
  | HeatmapSeriesOption
  | LineSeriesOption
  | RadarSeriesOption
  | ScatterSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | RadarComponentOption
  | DatasetComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
>

export default echarts

echarts.registerTheme("app", {
  color: [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
  ],
})
