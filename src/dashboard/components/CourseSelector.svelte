<script lang="ts">
  import { changeCourse, syncAll } from "@/dashboard/course"
  import { courseStore } from "@/dashboard/course.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { RefreshCwIcon } from "@lucide/svelte"
  import type { ChangeEventHandler } from "svelte/elements"

  let isSyncing = $state(false)

  const handleOnChange: ChangeEventHandler<HTMLSelectElement> = async (e) => {
    isSyncing = true
    try {
      await changeCourse(Number(e.currentTarget.value))
    } finally {
      isSyncing = false
    }
  }

  const handleSync = async () => {
    isSyncing = true
    try {
      await syncAll()
    } finally {
      isSyncing = false
    }
  }
</script>

<div class="flex items-center gap-2">
  <select
    class="select select-sm"
    name="course"
    disabled={isSyncing || courseStore.courseItems.length === 0}
    aria-label={m.select_course()}
    value={courseStore.currentCourse?.id}
    onchange={handleOnChange}
  >
    <option value="" hidden>-- {m.select_course()} --</option>
    {#each courseStore.courseItems as course (course.id)}
      <option value={course.id}>{course.id} - {course.name}</option>
    {/each}
  </select>
  <button
    class="group btn btn-square p-1 btn-primary btn-sm"
    class:invisible={!courseStore.currentCourse?.id}
    onclick={handleSync}
    disabled={isSyncing}
    aria-label={m.sync_course_data()}
    title={m.sync_course_data()}
  >
    <RefreshCwIcon class="group-disabled:animate-spin" />
  </button>
</div>
