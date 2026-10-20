<script lang="ts">
  import ChartSelector from "@/charts/components/ChartSelector.svelte"
  import InfoSelector from "@/dashboard/components/InfoSelector.svelte"
  import UserSelector from "@/dashboard/components/UserSelector.svelte"
  import CourseSelector from "@/header/components/CourseSelector.svelte"
</script>

<div class="flex size-full gap-2">
  <section class="flex w-xs max-w-xs min-w-xs flex-col gap-2">
    <CourseSelector />
    <UserSelector />
    <InfoSelector />
  </section>
  <ChartSelector />
</div>
