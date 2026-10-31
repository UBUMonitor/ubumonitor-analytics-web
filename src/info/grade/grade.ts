import type { CourseGradeItemsResponseDto } from "@/backend/model"
import { courseStore } from "@/dashboard/course.svelte"
import { gradeStore } from "@/info/grade/grade.svelte"

export async function updateGrades(response: Promise<CourseGradeItemsResponseDto>) {
  gradeStore.isLoading = true
  try {
    const { gradeItems } = await response

    gradeStore.items = gradeItems.map(({ id, name }) => ({
      id,
      checked: false,
      name: name ?? courseStore.currentCourse?.id,
    }))
  } finally {
    gradeStore.isLoading = false
  }
}
