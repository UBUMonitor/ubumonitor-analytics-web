import type {
  CourseContentModuleDto,
  CourseContentResponseDto,
  CourseContentSectionDto,
  CourseLogsResponseDto,
  LogColumnComponentsEventsInnerDto,
  LogComponentDto,
  OriginDto,
} from "@/backend/model"
import { getCourseContent, syncCourseContent } from "@/backend/services/course-content"
import { getCourseLogFilters, syncCourseLogs } from "@/backend/services/course-logs"
import { coursesStore } from "@/stores/courses.svelte"
import { withChecked, withCheckedAndTranslate, withTranslate } from "@/stores/utils"
import { includeIntl, sortCompare, translateCode } from "@/utils/i18n"
import type { NamedSelectableItem } from "@/utils/utils"

export type ItemByType = {
  components: Component
  events: Event
  sections: Section
  modules: Module
}

/** Discriminated union: `selectedInfo` determines the type of `selectedItems`. */
export type Selection = {
  [K in RecordType]: { selectedInfo: K; selectedItems: ItemByType[K][] }
}[RecordType]

const filterChecked = <T extends NamedSelectableItem>(items: T[]) =>
  items.filter(({ checked }) => checked)

export type RecordType = "components" | "events" | "sections" | "modules"

export type Component = LogComponentDto & NamedSelectableItem
export type Event = LogColumnComponentsEventsInnerDto & NamedSelectableItem
export type Section = CourseContentSectionDto & NamedSelectableItem
export type Module = CourseContentModuleDto & NamedSelectableItem & { sectionId: number }
export type Origin = OriginDto

class RecordsStore {
  isLoading = $state(false)

  selected = $state<RecordType>("components")
  selectedDisplay = $state("")

  readonly selection = $derived.by((): Selection => {
    switch (this.selected) {
      case "components":
        return { selectedInfo: "components", selectedItems: filterChecked(this.components) }
      case "events":
        return { selectedInfo: "events", selectedItems: filterChecked(this.events) }
      case "sections":
        return { selectedInfo: "sections", selectedItems: filterChecked(this.sections) }
      case "modules":
        return { selectedInfo: "modules", selectedItems: filterChecked(this.modules) }
    }
  })

  allComponents = $state<Component[]>([])
  componentsFilter = $state("")
  readonly components = $derived(this.#filter(this.allComponents, this.componentsFilter))
  readonly componentsMap = $derived(
    new Map(this.allComponents.map((component) => [component.id, component])),
  )

  allEvents = $state<Event[]>([])
  eventsFilter = $state("")
  readonly events = $derived(this.#filter(this.allEvents, this.eventsFilter))
  readonly eventsMap = $derived(
    new Map(this.allEvents.map((event) => [event.event.id, event.event])),
  )

  allSections = $state<Section[]>([])
  sectionsFilter = $state("")
  sectionsHidden = $state(false)
  readonly sections = $derived(
    this.#filter(this.allSections, this.sectionsFilter).filter(
      (section) => this.sectionsHidden || section.visible,
    ),
  )
  readonly sectionsMap = $derived(new Map(this.allSections.map((section) => [section.id, section])))

  allModules = $state<Module[]>([])
  modulesFilter = $state("")
  modulesHidden = $state(false)
  readonly modules = $derived(
    this.#filter(this.allModules, this.modulesFilter).filter(
      (module) => this.modulesHidden || module.visible,
    ),
  )
  readonly modulesMap = $derived(new Map(this.allModules.map((module) => [module.id, module])))

  allOrigins = $state<Origin[]>([])
  originsMap = $derived(new Map(this.allOrigins.map((origin) => [origin.id, origin])))

  constructor() {
    $effect.root(() => {
      $effect(() => {
        console.log("$effect RecordsStore")

        const currentCourse = coursesStore.currentCourse

        if (currentCourse == null) {
          this.clear()
          return
        }

        if (currentCourse.lastSync) {
          this.#updateContent(
            getCourseContent(currentCourse.id),
            getCourseLogFilters(currentCourse.id),
          )
        } else {
          this.sync()
        }
      })
    })
  }

  async #updateContent(
    content: Promise<CourseContentResponseDto>,
    logs: Promise<CourseLogsResponseDto>,
  ) {
    this.isLoading = true
    this.clear()

    const contentTask = content.then(({ sections }) => {
      this.allSections = withChecked(sections)
      this.allModules = withChecked(
        sections.flatMap(({ modules, id }) =>
          modules.map((module) => ({
            ...module,
            sectionId: id,
          })),
        ),
      )
    })

    const logsTask = logs.then(({ column }) => {
      this.allComponents = withCheckedAndTranslate(column.components)
      this.allEvents = column.componentsEvents
        .map((item, index) => ({
          ...item,
          id: index,
          name: translateCode(item.component.code) + " - " + translateCode(item.event.code),
          checked: false,
        }))
        .sort((x, y) => sortCompare(x.name, y.name))
      this.allOrigins = withTranslate(column.origins)
    })

    Promise.all([contentTask, logsTask]).finally(() => (this.isLoading = false))
  }

  async sync() {
    const courseId = coursesStore.currentCourse?.id

    if (!courseId) {
      return
    }

    await this.#updateContent(syncCourseContent(courseId), syncCourseLogs(courseId))
  }

  clear() {
    this.allComponents = []
    this.componentsFilter = ""
    this.allEvents = []
    this.eventsFilter = ""
    this.allSections = []
    this.sectionsFilter = ""
    this.allModules = []
    this.modulesFilter = ""
  }

  #filter<T extends NamedSelectableItem>(items: T[], search: string) {
    return items.filter(({ name }) => includeIntl(name, search))
  }

  getSectionByModule(moduleId: number) {
    const sectionId = this.modulesMap.get(moduleId)?.sectionId

    return sectionId !== undefined ? this.sectionsMap.get(sectionId) : undefined
  }
}

export const recordsStore = new RecordsStore()
