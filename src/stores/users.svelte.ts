import type { CourseEnrollmentsResponseDto } from "@/backend/model"
import { getCourseEnrollments, syncCourseEnrollments } from "@/backend/services/course-enrollments"
import { m } from "@/paraglide/messages"
import { coursesStore } from "@/stores/courses.svelte"
import { withChecked } from "@/stores/utils"
import { containsInterval } from "@/utils/datetime"
import { includeIntl, sortCompare } from "@/utils/i18n"
import type { NamedSelectableItem } from "@/utils/utils"
import { DateTime } from "luxon"

export interface User extends NamedSelectableItem {
  imageUrl: string
  lastAccess?: DateTime
  lastCourseAccess?: DateTime
  roles: number[]
  groups: number[]
}

export interface Connection extends NamedSelectableItem {
  contains: (date?: DateTime) => boolean
}

class UsersStore {
  isLoading = $state(false)

  users = $state<User[]>([])
  readonly usersMap = $derived(new Map(this.users.map((user) => [user.id, user])))

  userFilter = $state("")
  roles = $state<NamedSelectableItem[]>([])
  groups = $state<NamedSelectableItem[]>([])
  connections = $state<Connection[]>([
    {
      id: 0,
      name: m.date_range_within_days({ days: 2 }),
      checked: false,
      contains: containsInterval({ daysFrom: 2 }),
    },
    {
      id: 1,
      name: m.date_range_between_days_ago({ minDays: 3, maxDays: 6 }),
      checked: false,
      contains: containsInterval({ daysTo: 3, daysFrom: 6 }),
    },
    {
      id: 2,
      name: m.date_range_between_days_ago({ minDays: 7, maxDays: 12 }),
      checked: false,
      contains: containsInterval({ daysTo: 7, daysFrom: 12 }),
    },
    {
      id: 3,
      name: m.date_range_older_than({ days: 13 }),
      checked: false,
      contains: containsInterval({ daysTo: 13 }),
    },
  ])

  readonly filteredUsers = $derived.by(() => {
    const rolesIds = new Set(this.roles.filter(({ checked }) => checked).map(({ id }) => id))
    const groupsIds = new Set(this.groups.filter(({ checked }) => checked).map(({ id }) => id))
    const connectionsIntervals = this.connections.filter(({ checked }) => checked)

    if (
      rolesIds.size === 0 &&
      groupsIds.size === 0 &&
      this.userFilter === "" &&
      connectionsIntervals.length === 0
    ) {
      return this.users
    }

    return this.users.filter(({ roles, groups, name, lastCourseAccess }) => {
      const matchesRole = rolesIds.size === 0 || roles.some((r) => rolesIds.has(r))

      const matchesGroup = groupsIds.size === 0 || groups.some((g) => groupsIds.has(g))

      const matchesFilter = this.userFilter === "" || includeIntl(name, this.userFilter)

      const matchesConnection =
        connectionsIntervals.length === 0 ||
        connectionsIntervals.some(({ contains }) => contains(lastCourseAccess))

      return matchesRole && matchesGroup && matchesFilter && matchesConnection
    })
  })

  readonly selectedUsers = $derived(this.filteredUsers.filter(({ checked }) => checked))

  constructor() {
    $effect.root(() => {
      $effect(() => {
        console.log("$effect UsersStore")
        this.clear()

        const currentCourse = coursesStore.currentCourse

        if (currentCourse == null) {
          return
        }

        if (currentCourse.lastSync) {
          this.#updateUsers(getCourseEnrollments(currentCourse.id))
        } else {
          this.sync()

          currentCourse.lastSync = DateTime.now()
        }
      })
    })
  }

  async #updateUsers(usersInfo: Promise<CourseEnrollmentsResponseDto>) {
    this.isLoading = true

    try {
      const { users, roles, groups } = await usersInfo

      this.users = users
        .sort((x, y) => sortCompare(x.fullName, y.fullName))
        .map(({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => {
          const lastAccessDate = lastAccess ? DateTime.fromSeconds(lastAccess) : undefined
          const lastCourseAccessDate = lastCourseAccess
            ? DateTime.fromSeconds(lastCourseAccess)
            : undefined

          return {
            id,
            checked: false,
            name: fullName,
            imageUrl,
            lastAccess: lastAccessDate,
            lastCourseAccess: lastCourseAccessDate,
            roles: roles.map(({ id }) => id),
            groups: groups.map(({ id }) => id),
          }
        })

      this.roles = withChecked(roles?.sort((x, y) => sortCompare(x.name, y.name)))
      this.groups = withChecked(groups?.sort((x, y) => sortCompare(x.name, y.name)))
    } finally {
      this.isLoading = false
    }
  }

  async sync() {
    const courseId = coursesStore.currentCourse?.id

    if (!courseId) {
      return
    }

    await this.#updateUsers(syncCourseEnrollments(courseId))
  }

  clear() {
    this.users = []
    this.userFilter = ""
    this.roles = []
    this.groups = []
  }
}

export const usersStore = new UsersStore()
