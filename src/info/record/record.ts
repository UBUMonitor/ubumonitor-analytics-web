import type { CourseContentResponseDto, CourseLogsResponseDto } from "@/backend/model"
import { recordStore } from "@/info/record/record.svelte"

async function updateContent(response: Promise<CourseContentResponseDto>) {
  const { sections } = await response

  recordStore.sectionItems = sections.map(({ id, name }) => ({
    id,
    checked: false,
    name,
  }))

  const modules = sections.flatMap(({ modules }) => modules)

  recordStore.moduleItems = modules.map(({ id, name, modName }) => ({
    id,
    checked: false,
    name,
    modName,
  }))
}

async function updateLogs(response: Promise<CourseLogsResponseDto>) {
  const { column } = await response

  recordStore.componentItems = column.components.map(({ id, name }) => ({
    id,
    name,
    checked: false,
  }))

  recordStore.eventItems = column.events.map(({ id, name }) => ({
    id,
    name,
    checked: false,
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
