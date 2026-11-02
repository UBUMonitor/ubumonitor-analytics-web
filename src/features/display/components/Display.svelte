<script lang="ts">
  import ChartComponent from "@/features/display/components/ChartComponent.svelte"
  import DisplaySettings from "@/features/display/components/DisplaySettings.svelte"
  import TableComponent from "@/features/display/components/TableComponent.svelte"
  import { displayStore } from "@/features/display/display.svelte"
  import { displayOptions } from "@/features/records/displayOptions"
</script>

<main class="flex size-full flex-col">
  <div class="tabs tabs-box">
    {#each displayOptions as option (option.value)}
      <input
        type="radio"
        name="chart_select"
        class="tab"
        aria-label={option.label()}
        value={option.value}
        checked={displayStore.selectedDisplay === option.value}
        onchange={() => (displayStore.selectedDisplay = option.value)}
      />
    {/each}
  </div>
  <div class="card min-h-0 flex-1 border-base-300 bg-base-100 p-1 card-border">
    {#if displayStore.config.type === "chart"}
      <ChartComponent option={displayStore.config.option} />
    {:else if displayStore.config.type === "table"}
      <TableComponent option={displayStore.config.option} />
    {/if}
  </div>
  <DisplaySettings />
</main>
