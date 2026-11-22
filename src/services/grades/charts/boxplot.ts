import { m } from "@/paraglide/messages"
import { round2 } from "@/services/display/utils"
import { getGradesByUser, type GradesChartParams } from "@/services/grades/charts/shared"
import type { DisplayConfig } from "@/stores/display.svelte"
import { format } from "echarts/core"

const BOX_WIDTH = 0.6
const BOX_WIDTH_PERCENT = `${BOX_WIDTH * 100}%`
const JITTER_WIDTH = BOX_WIDTH - 0.1

interface UserPoint {
  value: [number, number] // [categoryIndex + jitter, grade]
  itemName: string
  userName: string
  imageUrl: string
}

const row = (marker: string, label: string, value: string | number) =>
  `<div style="margin-top:10px">${marker}<span style="margin-left:2px">${label}</span><span style="float:right;margin-left:20px;font-weight:900">${value}</span></div>`

export async function gradesBoxplotChart({
  courseId,
  gradeItems,
  userItems,
}: GradesChartParams): Promise<DisplayConfig> {
  const gradesByUser = await getGradesByUser({ courseId, gradeItems, userItems })

  const names: string[] = []
  const rows: number[][] = [] // one row of raw grades per box
  const points: UserPoint[] = [] // one point per user and grade item

  for (const { id, name } of gradeItems) {
    const itemName = name ?? ""
    const values: number[] = []
    const categoryIndex = names.length

    userItems.forEach((user) => {
      const grade = gradesByUser.get(user.id)?.get(id)
      if (grade === undefined) return

      values.push(grade)

      // Deterministic jitter (golden-ratio sequence) so points don't overlap
      const jitter = (((user.id * 0.618034) % 1) - 0.5) * JITTER_WIDTH
      points.push({
        value: [categoryIndex + jitter, grade],
        itemName,
        userName: user.name,
        imageUrl: user.imageUrl,
      })
    })

    // Items without grades are kept: empty row, so the category still shows up
    names.push(itemName)
    rows.push(values)
  }

  return {
    type: "chart",
    option: {
      dataset: [
        { source: rows },
        {
          transform: {
            type: "boxplot",
            config: { itemNameFormatter: ({ value }: { value: number }) => names[value] },
          },
        },
      ],
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0]! : params
          const marker = p.marker as string

          if (p.seriesType === "scatter") {
            const { itemName, userName, imageUrl, value } = p.data as UserPoint

            const image = `<img src="${format.encodeHTML(imageUrl)}" width="100" height="100" style="border-radius:4px;object-fit:cover">`

            return `<div style="line-height:1">${image}<div style="margin-top:10px">${format.encodeHTML(userName)}</div>${row(marker, format.encodeHTML(itemName), round2(value[1]))}</div>`
          }

          // Box: the last 5 entries are [min, Q1, median, Q3, max],
          // regardless of whether a leading name/index entry is present
          const [min, q1, median, q3, max] = (p.value as number[]).slice(-5).map(round2) as [
            number,
            number,
            number,
            number,
            number,
          ]
          const values = rows[p.dataIndex]!
          const mean = round2(values.reduce((sum, v) => sum + v, 0) / values.length)

          return `<div style="line-height:1"><div>${format.encodeHTML(names[p.dataIndex]!)}</div>${[
            row(marker, "n", values.length),
            row(marker, m.max(), max),
            row(marker, "Q3", q3),
            row(marker, m.median(), median),
            row(marker, "Q1", q1),
            row(marker, m.min(), min),
            row(marker, m.mean(), mean),
          ].join("")}</div>`
        },
      },
      xAxis: [
        {
          type: "category",
          data: names,
          axisLabel: { interval: 0, overflow: "truncate", width: 160, rotate: 45 },
        },
        {
          // Hidden numeric axis so the scatter keeps its fractional jitter.
          // A category axis spans [-0.5, n - 0.5], so this one matches it exactly.
          type: "value",
          show: false,
          min: -0.5,
          max: names.length - 0.5,
        },
      ],
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLine: { onZero: false },
      },
      series: [
        {
          type: "boxplot",
          datasetIndex: 1,
          boxWidth: [BOX_WIDTH_PERCENT, BOX_WIDTH_PERCENT],
        },
        {
          type: "scatter",
          data: points,
          xAxisIndex: 1,
          yAxisIndex: 0,
          symbolSize: 6,
          z: 3,
          animation: false,
        },
      ],
    },
  }
}
