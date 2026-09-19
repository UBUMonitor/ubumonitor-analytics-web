<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
  import { setCourse } from "@/lib/moodle"
  import { m } from "@/paraglide/messages.js"
</script>

{#if appStore.courseItems}
  <select
    class="select w-lg select-sm"
    name="course"
    onchange={(e) => setCourse(Number(e.currentTarget.value))}
  >
    <option hidden> -- {m.select_course_label()} -- </option>
    {#each appStore.courseItems as course (course.id)}
      <option value={course.id} selected={course.id === appStore.currentCourseId}>
        {course.id} - {course.name}
      </option>
    {/each}
  </select>
{/if}
