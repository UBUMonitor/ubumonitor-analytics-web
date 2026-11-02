import type { CourseGradeItemsResponseDto } from "@/backend/model"
import { checkedIds } from "@/shared/lib/selection"
import type { SelectableItem } from "@/shared/types/selectable-item"

class GradeStore {
  items = $state<SelectableItem[]>([])

  reset() {
    this.items = []
  }

  async updateGrades(response: Promise<CourseGradeItemsResponseDto>, defaultName: string) {
    const { gradeItems } = await response
    const selectedIds = checkedIds(this.items)
    this.items = gradeItems.map(({ id, name }) => ({
      id,
      checked: selectedIds.has(id),
      name: name ?? defaultName,
    }))
  }
}

export const gradeStore = new GradeStore()
