import { format } from "echarts"
import type { TooltipMarker } from "echarts/types/src/util/format.js"

export const round2 = (value: number): number => Math.round(value * 100) / 100

const { encodeHTML } = format

type BasicTooltipParams = {
  userName: string
  name: string
  img: string
  marker?: TooltipMarker
  value: number
}

const STYLES = {
  root: "line-height:1",
  img: "width:100px;height:100px;border-radius:4px;object-fit:cover;display:block",
  userName: "margin-top:10px",
  row: "margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:20px",
  label: "display:flex;align-items:center;gap:2px",
  value: "font-weight:900",
} as const

export function basicTooltip({
  userName,
  name,
  img,
  marker = "",
  value,
}: BasicTooltipParams): string {
  const safeUserName = encodeHTML(userName)
  const safeName = encodeHTML(name)
  const safeImg = encodeHTML(img)
  const safeValue = encodeHTML(String(value ?? "-"))

  return `
    <div style="${STYLES.root}">
      <img src="${safeImg}" alt="${safeUserName}" style="${STYLES.img}">
      <div style="${STYLES.userName}">${safeUserName}</div>
      <div style="${STYLES.row}">
        <span style="${STYLES.label}">${marker}<span>${safeName}</span></span>
        <span style="${STYLES.value}">${safeValue}</span>
      </div>
    </div>
  `.trim()
}
