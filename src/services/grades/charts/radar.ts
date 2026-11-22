import type { GradeItemDto } from "@/backend/model"
import { m } from "@/paraglide/messages"
import {
  getGradesByUser,
  type GradesByUser,
  type GradesChartParams,
} from "@/services/grades/charts/shared"
import type { DisplayConfig } from "@/stores/display.svelte"

type GradeValue = number | null

const EMPTY_CHART: DisplayConfig = { type: "chart", option: {} }

function getUserValues(
  gradesByUser: GradesByUser,
  userId: number,
  gradeItems: GradeItemDto[],
): GradeValue[] {
  const userGrades = gradesByUser.get(userId)
  return gradeItems.map(({ id }) => userGrades?.get(id) ?? null)
}

function getMeanValues(userValues: GradeValue[][], itemCount: number): GradeValue[] {
  return Array.from({ length: itemCount }, (_, index) => {
    let total = 0
    let count = 0

    for (const values of userValues) {
      const value = values[index]
      if (value == null) continue
      total += value
      count++
    }

    return count > 0 ? total / count : null
  })
}

export async function gradesRadarChart({
  courseId,
  gradeItems,
  userItems,
}: GradesChartParams): Promise<DisplayConfig> {
  if (gradeItems.length === 0) return EMPTY_CHART

  const gradesByUser = await getGradesByUser({ courseId, gradeItems, userItems })

  const userSeries = userItems.map((user) => ({
    name: user.name,
    value: getUserValues(gradesByUser, user.id, gradeItems),
    fullName: user.name,
    img: user.imageUrl,
  }))

  const mean =
    userSeries.length > 1
      ? {
          name: m.mean(),
          value: getMeanValues(
            userSeries.map(({ value }) => value),
            gradeItems.length,
          ),
          lineStyle: { type: "dashed" as const },
          itemStyle: { color: "#000000" },
          areaStyle: { opacity: 0.1 },
        }
      : null

  return {
    type: "chart",
    option: {
      tooltip: {},
      legend: { type: "scroll", top: "top", left: "center" },
      radar: {
        radius: "75%",
        indicator: gradeItems.map(({ name }) => ({ name: name ?? "", min: 0, max: 100 })),
      },
      series: [
        {
          type: "radar",
          areaStyle: { opacity: 0.25 },
          emphasis: {
            areaStyle: { opacity: 0.5 },
          },
          data: mean ? [...userSeries, mean] : userSeries,
        },
      ],
    },
  }
}
