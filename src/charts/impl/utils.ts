import echarts from "./echarts"
import { formatSlot, type StatsInterval } from "@/charts/impl/dateUtils"
import type { CallbackDataParams } from "echarts/types/dist/shared"
import type { Dictionary, OptionDataItem, OptionDataValue } from "echarts/types/src/util/types.js"

export const round2 = (value: number): number => Math.round(value * 100) / 100

export function formatTooltip(
  interval: StatsInterval,
  params: CallbackDataParams,
  value?: OptionDataItem,
) {
  const data = params.data as Dictionary<OptionDataValue>
  value = value ?? params.value
  const fullName = echarts.format.encodeHTML(data.fullName as string)

  return `<div style="line-height:1">
    <img style="border-radius:4px" src="${data.img}" width="100" height="100" />
    <div style="margin:10px 0 0">${fullName}</div>
    <div style="margin:10px 0 0">
      <div>
        ${params.marker}<span style="margin-left:2px"
          >${formatSlot(interval, params.name)}</span
        ><span style="float:right;margin-left:20px;font-weight:900"
          >${value}</span
        >
      </div>
    </div>
  </div>
`
}
