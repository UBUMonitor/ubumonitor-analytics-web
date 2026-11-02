<script lang="ts">
  import { displayStore } from "@/features/display/display.svelte"
  import { getDisplayOption } from "@/features/records/displayOptions"
  import {
    fromDateTimeInput,
    StatsInterval,
    toDateTimeInput,
    type StatsInterval as StatsIntervalType,
  } from "@/shared/lib/datetime"
  import { m } from "@/shared/paraglide/messages"
  import { DateTime } from "luxon"

  // Keep the valid input window fixed for the lifetime of the settings panel.
  const minDate = toDateTimeInput(DateTime.now().minus({ years: 5 }).startOf("day"))
  const maxDate = toDateTimeInput(DateTime.now().plus({ day: 1 }).startOf("day"))
  const intervalLabels: Record<StatsIntervalType, () => string> = {
    [StatsInterval.HOURLY]: m.hour,
    [StatsInterval.DAILY]: m.day,
    [StatsInterval.WEEKLY]: m.week,
    [StatsInterval.MONTHLY]: m.month,
    [StatsInterval.DAY_OF_WEEK]: m.day_of_week,
  }
  const intervals = Object.values(StatsInterval)
  const option = $derived(getDisplayOption(displayStore.selectedDisplay))
  const showScale = $derived(option?.display.hasScale() ?? false)
  const showGroup = $derived(option?.display.hasGroup() ?? false)
</script>

<div class="card mt-2 flex-row justify-between border-base-300 bg-base-100 p-2 px-24 card-border">
  <div class="flex flex-col gap-2">
    {#if showScale}
      <label class="input input-sm">
        <span class="label">{m.suggested_max_scale()}</span>
        <input
          type="number"
          value={displayStore.scale}
          oninput={(event) => (displayStore.scale = Number(event.currentTarget.value))}
          step="10"
          min="10"
        />
      </label>
    {/if}
    {#if showGroup}
      <label class="select select-sm">
        <span class="label">{m.group_by()}</span>
        <select
          value={displayStore.group}
          onchange={(event) =>
            (displayStore.group = event.currentTarget.value as StatsIntervalType)}
        >
          {#each intervals as interval (interval)}
            <option value={interval}>{intervalLabels[interval]()}</option>
          {/each}
        </select>
      </label>
    {/if}
  </div>
  <div class="flex flex-col gap-2">
    <label class="input w-sm input-sm">
      <span class="label flex-1">{m.start_datetime()}</span>
      <input
        type="datetime-local"
        class="w-auto flex-1"
        value={toDateTimeInput(displayStore.from)}
        onchange={(e) => {
          const dateTime = fromDateTimeInput(e.currentTarget.value)
          if (dateTime) displayStore.from = dateTime
        }}
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
        onchange={(e) => {
          const dateTime = fromDateTimeInput(e.currentTarget.value)
          if (dateTime) displayStore.to = dateTime
        }}
        required
        step="1"
        min={minDate}
        max={maxDate}
      />
    </label>
  </div>
</div>
