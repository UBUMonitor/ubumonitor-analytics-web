<script lang="ts">
  import ChartSelector from "@/charts/components/ChartSelector.svelte"
  import InfoSelector from "@/dashboard/components/InfoSelector.svelte"
  import UserSelector from "@/dashboard/components/UserSelector.svelte"
</script>

<div class="flex size-full">
  <section class="grid h-full w-xs max-w-xs min-w-xs grid-rows-2 border-r bg-base-200">
    <UserSelector />
    <InfoSelector />
  </section>
  <ChartSelector />
</div>
