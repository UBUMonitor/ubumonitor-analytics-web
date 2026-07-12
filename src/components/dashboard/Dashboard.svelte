<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
  import { getCurrentCourseId } from "@/lib/sessionStore.svelte"
  import { dedupeBy } from "@/lib/utils"
  import type { CourseContentResponseDto, CourseEnrollmentsResponseDto } from "@/model"
  import { getCourseUsersContentInfo } from "@/services/course-content/course-content"
  import { getCourseUsersEnrollmentsInfo } from "@/services/course-enrollments/course-enrollments"
  import ChartSelector from "../charts/ChartSelector.svelte"
  import InfoSelector from "./InfoSelector.svelte"
  import UserSelector from "./UserSelector.svelte"

  $effect(() => {
    if (!getCurrentCourseId()) {
      return
    }

    getCourseUsersEnrollmentsInfo(getCurrentCourseId()).then(({ data }) => {
      const users = (data as CourseEnrollmentsResponseDto).users
      appStore.userItems = users.map(
        ({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => ({
          id,
          checked: false,
          name: fullName,
          imageUrl,
          lastAccess,
          lastCourseAccess,
          roles: roles.map(({ id }) => id),
          groups: groups.map(({ id }) => id),
          show: true,
        }),
      )

      appStore.roleItems = dedupeBy(
        users.flatMap(({ roles }) => roles),
        (role) => role.id,
      ).map(({ id, name }) => ({ id, name, checked: false }))

      appStore.groupItems = dedupeBy(
        users.flatMap(({ groups }) => groups),
        (group) => group.id,
      ).map(({ id, name }) => ({ id, name, checked: false }))
    })

    getCourseUsersContentInfo(getCurrentCourseId()).then(({ data }) => {
      const sections = (data as CourseContentResponseDto).sections
      const modules = sections.flatMap(({ modules }) => modules)

      appStore.sectionItems = sections.map(({ id, name, modules }) => ({
        id,
        checked: false,
        name,
        modules: modules.map(({ id }) => id),
      }))
      appStore.moduleItems = modules.map(({ id, name, modName }) => ({
        id,
        checked: false,
        name,
        modName,
      }))
    })
  })
</script>

<div class="flex size-full">
  <section class="grid h-full w-xs max-w-xs min-w-xs grid-rows-2 border-r bg-base-200">
    <UserSelector />
    <InfoSelector />
  </section>
  <ChartSelector />
</div>
