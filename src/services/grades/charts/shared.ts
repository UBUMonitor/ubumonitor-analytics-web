import type { GradeItemDto } from "@/backend/model"
import { getCourseGradeValues } from "@/backend/services/course-grades"
import type { User } from "@/stores/users.svelte"

export type GradesChartParams = {
  courseId?: number
  gradeItems: GradeItemDto[]
  userItems: User[]
}

// userId -> gradeId -> percentage
export type GradesByUser = Map<number, Map<number, number>>

export async function getGradesByUser({
  courseId,
  gradeItems,
  userItems,
}: GradesChartParams): Promise<GradesByUser> {
  if (courseId == null || gradeItems.length === 0 || userItems.length === 0) {
    return new Map()
  }

  const { grades } = await getCourseGradeValues(courseId, {
    gradeItemsIds: gradeItems.map(({ id }) => id),
    userIds: userItems.map(({ id }) => id),
  })

  const gradesByUser: GradesByUser = new Map()

  for (const { id, userId, percentage } of grades) {
    if (percentage == null) continue

    let userGrades = gradesByUser.get(userId)
    if (!userGrades) {
      userGrades = new Map()
      gradesByUser.set(userId, userGrades)
    }

    userGrades.set(id, percentage)
  }

  return gradesByUser
}
