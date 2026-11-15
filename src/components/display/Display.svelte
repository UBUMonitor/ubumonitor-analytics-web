<script lang="ts">
  import ChartComponent from "@/components/display/ChartComponent.svelte"
  import TableComponent from "@/components/display/TableComponent.svelte"
  import { m } from "@/paraglide/messages"
  import { displayStore } from "@/stores/display.svelte"
  import { fromDateTimeInput, toDateTimeInput } from "@/utils/datetime"
  import { DateTime } from "luxon"

  const minDate = toDateTimeInput(DateTime.now().minus({ years: 5 }).startOf("day"))
  const maxDate = toDateTimeInput(DateTime.now().plus({ day: 1 }).startOf("day"))
</script>

<main class="flex size-full flex-col">
  <div class="tabs-box tabs">
    {#each displayStore.display as option (option.value)}
      <input
        type="radio"
        name="diplay_tab"
        class="tab"
        aria-label={option.name}
        value={option.value}
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

  <div class="card mt-2 flex-row justify-between border-base-300 bg-base-100 p-2 px-24 card-border">
    <div class="flex flex-col gap-2">
      {#if displayStore.showScale}
        <label class="input input-sm">
          <span class="label">{m.suggested_max_scale()}</span>
          <input type="number" bind:value={displayStore.scale} step="10" min="10" />
        </label>
      {/if}
      {#if displayStore.showInterval}
        <label class="select select-sm">
          <span class="label">{m.group_by()}</span>
          <select bind:value={displayStore.interval}>
            <option value="HOURLY">{m.hour()}</option>
            <option value="DAILY">{m.day()}</option>
            <option value="WEEKLY">{m.week()}</option>
            <option value="MONTHLY">{m.month()}</option>
            <option value="DAY_OF_WEEK">{m.day_of_week()}</option>
          </select>
        </label>
      {/if}
    </div>
    <div class="flex flex-col gap-2">
      {#if displayStore.showDate}
        <label class="input w-sm input-sm">
          <span class="label flex-1">{m.start_datetime()}</span>
          <input
            type="datetime-local"
            class="w-auto flex-1"
            value={toDateTimeInput(displayStore.from)}
            onchange={(e) => (displayStore.from = fromDateTimeInput(e.currentTarget.value))}
            required
            step="1"
            min={minDate}
            max={maxDate}
          />
        </label>

        <label class="input w-sm input-sm">
          <span class="label flex-1">{m.end_datetime()}</span>
          <input
            type="datetime-local"
            class="w-auto flex-1"
            value={toDateTimeInput(displayStore.to)}
            onchange={(e) => (displayStore.to = fromDateTimeInput(e.currentTarget.value))}
            required
            step="1"
            min={minDate}
            max={maxDate}
          />
        </label>
      {/if}
    </div>
  </div>
</main>
