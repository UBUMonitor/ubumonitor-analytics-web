<script lang="ts">
  import ChartComponent from "@/display/components/ChartComponent.svelte"
  import DisplaySettings from "@/display/components/DisplaySettings.svelte"
  import TableComponent from "@/display/components/TableComponent.svelte"
  import { displayStore } from "@/display/display.svelte"
</script>

<main class="flex size-full flex-col">
  <div class="tabs tabs-box">
    {#each displayStore.display as name (name)}
      <input
        type="radio"
        name="chart_select"
        class="tab"
        aria-label={name}
        value={name}
        bind:group={displayStore.selectedDisplay}
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
