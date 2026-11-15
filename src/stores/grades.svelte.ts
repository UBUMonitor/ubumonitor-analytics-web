import type { CourseGradeItemsResponseDto, GradeItemDto } from "@/backend/model"
import { getCourseGrades, syncCourseGrades } from "@/backend/services/course-grades"
import { coursesStore } from "@/stores/courses.svelte"
import { includeIntl } from "@/utils/i18n"
import type { NamedSelectableItem } from "@/utils/utils"

export type Grades = GradeItemDto & NamedSelectableItem

class GradesStore {
  isLoading = $state(false)

  grades = $state<Grades[]>([])
  gradesFilter = $state("")

  readonly filteredGrades = $derived(this.#filter(this.grades, this.gradesFilter))

  constructor() {
    $effect.root(() => {
      $effect(() => {
        console.log("$effect GradesStore")
        this.clear()

        const currentCourse = coursesStore.currentCourse

        if (currentCourse == null) {
          return
        }

        if (currentCourse.lastSync) {
          this.#updateContent(getCourseGrades(currentCourse.id))
        } else {
          this.sync()
        }
      })
    })
  }

  async #updateContent(grades: Promise<CourseGradeItemsResponseDto>) {
    this.isLoading = true

    try {
      const { gradeItems } = await grades

      this.grades = gradeItems.map((item) => ({
        ...item,
        name: item.name || coursesStore.currentCourse!.name,
        checked: false,
      }))
    } finally {
      this.isLoading = false
    }
  }

  async sync() {
    const courseId = coursesStore.currentCourse?.id

    if (!courseId) {
      return
    }

    await this.#updateContent(syncCourseGrades(courseId))
  }

  clear() {
    this.grades = []
    this.gradesFilter = ""
  }

  #filter<T extends NamedSelectableItem>(items: T[], search: string) {
    return items.filter(({ name }) => includeIntl(name, search))
  }
}

export const gradesStore = new GradesStore()
