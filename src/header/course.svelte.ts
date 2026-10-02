export interface CourseItem {
  id: number
  name: string
  startDate?: string
  endDate?: string
}

export const courseStore = $state({
  currentCourseId: 0,
  courseItems: [] as CourseItem[],
})

export function clearAppStore() {
  courseStore.currentCourseId = 0
  courseStore.courseItems = []
}
