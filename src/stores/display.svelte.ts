import type { ECOption } from "@/services/display/echarts"
import type { TableOption } from "@/services/display/table"
import { coursesStore } from "@/stores/courses.svelte"
import type { StatsInterval } from "@/utils/datetime"
import { DateTime } from "luxon"

export type DisplayConfig =
  { type: "chart"; option: ECOption } | { type: "table"; option: TableOption }

export interface DisplayOption {
  value: string
  name: string
}

const DEFAULT_FROM = DateTime.now().startOf("year")
const DEFAULT_TO = DateTime.now().plus({ day: 1 }).startOf("day")

class DisplayStore {
  config = $state.raw<DisplayConfig>({ type: "chart", option: {} })
  display = $state.raw<DisplayOption[]>([])
  selectedDisplay = $state("")

  from = $state(DEFAULT_FROM)
  to = $state(DEFAULT_TO)
  interval = $state<StatsInterval>("MONTHLY")
  scale = $state(60)

  showDate = $state(false)
  showScale = $state(false)
  showInterval = $state(false)

  constructor() {
    $effect.root(() => {
      $effect(() => {
        const currentCourse = coursesStore.currentCourse

        if (currentCourse != null) {
          this.from = currentCourse.startDate ?? DEFAULT_FROM
          this.to = currentCourse.endDate ?? DEFAULT_TO
        }
      })
    })
  }

  reset() {
    this.config = { type: "chart", option: {} }
    this.display = []
    this.selectedDisplay = ""
    this.showDate = false
    this.showScale = false
    this.showInterval = false
  }
}

export const displayStore = new DisplayStore()
