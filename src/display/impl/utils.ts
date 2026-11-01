import echarts from "@/display/impl/echarts"
import { formatSlot, type StatsInterval } from "@/shared/lib/datetime"

export const round2 = (value: number): number => Math.round(value * 100) / 100

export function formatTooltip(interval: StatsInterval, input: unknown, value?: unknown) {
  const params = Array.isArray(input) ? input[0] : input
  const tooltipParams = params && typeof params === "object" ? params : {}
  const data =
    "data" in tooltipParams && tooltipParams.data && typeof tooltipParams.data === "object"
      ? tooltipParams.data
      : {}
  const name =
    "name" in tooltipParams && typeof tooltipParams.name === "string" ? tooltipParams.name : ""
  const marker =
    "marker" in tooltipParams && typeof tooltipParams.marker === "string"
      ? tooltipParams.marker
      : ""
  const paramValue = "value" in tooltipParams ? tooltipParams.value : undefined
  const fullName = "fullName" in data && typeof data.fullName === "string" ? data.fullName : ""
  const image = "img" in data && typeof data.img === "string" ? data.img : ""
  const tooltipValue = value ?? paramValue ?? ""
  const encode = echarts.format.encodeHTML

  return `<div style="line-height:1"><img src="${encode(image)}" width="100" height="100" style="border-radius:4px"><div style="margin-top:10px">${encode(fullName)}</div><div style="margin-top:10px">${marker}<span style="margin-left:2px">${encode(formatSlot(interval, name))}</span><span style="float:right;margin-left:20px;font-weight:900">${encode(String(tooltipValue))}</span></div></div>`
}
