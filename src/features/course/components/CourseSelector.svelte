<script lang="ts">
  import { changeCourse, syncAll } from "@/features/course/course"
  import { courseStore } from "@/features/course/course.svelte"
  import { queryClient } from "@/shared/api/queryClient"
  import { notifyError } from "@/shared/lib/notify"
  import { m } from "@/shared/paraglide/messages"
  import { RefreshCwIcon } from "@lucide/svelte"
  import { useIsMutating } from "@tanstack/svelte-query"
  import type { ChangeEventHandler } from "svelte/elements"

  const isSyncing = useIsMutating(
    { predicate: (mutation) => mutation.options.meta?.sync === true },
    queryClient,
  )

  const handleOnChange: ChangeEventHandler<HTMLSelectElement> = async (e) => {
    await changeCourse(Number(e.currentTarget.value)).catch(notifyError)
  }

  const handleSync = async () => {
    const courseId = courseStore.currentCourse?.id
    if (courseId === undefined) return
    await syncAll(courseId).catch(notifyError)
  }
</script>

<div class="flex items-center gap-2">
  <select
    class="select select-sm"
    name="course"
    disabled={isSyncing.current > 0 || courseStore.courseItems.length === 0}
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
    class={[
      "group btn btn-square p-1 btn-primary btn-sm",
      !courseStore.currentCourse?.id && "invisible",
    ]}
    type="button"
    onclick={handleSync}
    disabled={isSyncing.current > 0 || !courseStore.currentCourse}
    aria-label={m.sync_course_data()}
    title={m.sync_course_data()}
  >
    <RefreshCwIcon />
  </button>
</div>
