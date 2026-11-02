<script lang="ts">
  import InfoSelector from "@/features/course/InfoSelector.svelte"
  import CourseSelector from "@/features/course/components/CourseSelector.svelte"
  import Display from "@/features/display/components/Display.svelte"
  import UserSelector from "@/features/users/components/UserSelector.svelte"
</script>

<div class="flex size-full gap-2">
  <section class="flex w-xs max-w-xs min-w-xs flex-col gap-2">
    <CourseSelector />
    <UserSelector />
    <InfoSelector />
  </section>
  <Display />
</div>
