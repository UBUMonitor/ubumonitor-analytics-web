<script lang="ts">
  import InfoSelector from "@/components/InfoSelector.svelte"
  import CourseSelector from "@/components/courses/CourseSelector.svelte"
  import Display from "@/components/display/Display.svelte"
  import UserSelector from "@/components/users/UsersSelector.svelte"
</script>

<div class="flex size-full gap-2">
  <section class="flex w-sm shrink-0 flex-col gap-2">
    <CourseSelector />
    <UserSelector />
    <InfoSelector />
  </section>
  <Display />
</div>
