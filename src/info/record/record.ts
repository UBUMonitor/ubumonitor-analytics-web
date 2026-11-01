import type { CourseContentResponseDto, CourseLogsResponseDto } from "@/backend/model"
import { recordStore } from "@/info/record/record.svelte"
import { m } from "@/shared/paraglide/messages"
import { getLocale } from "@/shared/paraglide/runtime"

async function updateContent(response: Promise<CourseContentResponseDto>) {
  const { sections } = await response

  recordStore.sectionItems = sections.map(({ id, name }) => ({
    id,
    checked: false,
    name,
  }))

  recordStore.moduleItems = sections
    .flatMap(({ modules, id: sectionId }) => modules.map((module) => ({ ...module, sectionId })))
    .map(({ id, name, modName, sectionId }) => ({
      id,
      checked: false,
      name,
      modName,
      sectionId,
    }))
}

async function updateLogs(response: Promise<CourseLogsResponseDto>) {
  const { column } = await response

  recordStore.componentItems = column.components
    .map(({ id, code }) => ({
      id,
      name: (m[code as keyof typeof m] as () => string)?.() ?? code,
      checked: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, getLocale()))

  recordStore.eventItems = column.events
    .map(({ id, code }) => ({
      id,
      name: (m[code as keyof typeof m] as () => string)?.() ?? code,
      checked: false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, getLocale()))

  recordStore.originItems = column.origins.map(({ id, code }) => ({
    id,
    name: (m[code as keyof typeof m] as () => string)?.() ?? code,
  }))
}

export async function updateRecords(
  content: Promise<CourseContentResponseDto>,
  logs: Promise<CourseLogsResponseDto>,
) {
  recordStore.isLoading = true
  try {
    await Promise.all([updateContent(content), updateLogs(logs)])
  } finally {
    recordStore.isLoading = false
  }
}
