<script lang="ts">
  import CourseSelector from "@/dashboard/components/CourseSelector.svelte"
  import Display from "@/display/components/Display.svelte"
  import InfoSelector from "@/info/components/InfoSelector.svelte"
  import UserSelector from "@/user/components/UserSelector.svelte"
</script>

<div class="flex size-full gap-2">
  <section class="flex w-xs max-w-xs min-w-xs flex-col gap-2">
    <CourseSelector />
    <UserSelector />
    <InfoSelector />
  </section>
  <Display />
</div>
