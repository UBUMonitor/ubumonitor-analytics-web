import type { CourseGradeItemsResponseDto } from "@/backend/model"
import type { SelectableItem } from "@/shared/types/selectable-item"

class GradeStore {
  items = $state<SelectableItem[]>([])

  reset() {
    this.items = []
  }

  async updateGrades(response: Promise<CourseGradeItemsResponseDto>, defaultName: string) {
    const { gradeItems } = await response
    const checkedIds = new Set(this.items.filter(({ checked }) => checked).map(({ id }) => id))
    this.items = gradeItems.map(({ id, name }) => ({
      id,
      checked: checkedIds.has(id),
      name: name ?? defaultName,
    }))
  }
}

export const gradeStore = new GradeStore()
