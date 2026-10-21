<script lang="ts">
  import { chartStore } from "@/charts/chart.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { DateTime } from "luxon"

  interface Props {
    showScale?: boolean
    showGroup?: boolean
  }

  const { showScale = false, showGroup = false }: Props = $props()
</script>

<div class="card mt-2 flex-row justify-between border-base-300 bg-base-100 p-2 px-24 card-border">
  <div class="flex flex-col gap-2">
    {#if showScale}
      <label class="input input-sm">
        <span class="label">{m.max_scale_label()}</span>
        <input type="number" bind:value={chartStore.scale} step="10" min="10" />
      </label>
    {/if}
    {#if showGroup}
      <label class="select select-sm">
        <span class="label">{m.group_by_label()}</span>
        <select bind:value={chartStore.group}>
          <option value="HOURLY">{m.hourly()}</option>
          <option value="DAILY">{m.daily()}</option>
          <option value="WEEKLY">{m.weekly()}</option>
          <option value="MONTHLY">{m.monthly()}</option>
          <option value="DAY_OF_WEEK">{m.day_of_week()}</option>
        </select>
      </label>
    {/if}
  </div>
  <div class="flex flex-col gap-2">
    <label class="input w-sm input-sm">
      <span class="label flex-1">{m.initial_reference_date_label()}</span>
      <input
        type="datetime-local"
        class="w-auto flex-1"
        value={chartStore.from}
        onchange={(e) => (chartStore.from = e.currentTarget.value)}
        required
        step="1"
        min={DateTime.now().minus({ years: 5 }).startOf("day").toFormat("yyyy-MM-dd'T'HH:mm")}
        max={DateTime.now().plus({ days: 1 }).startOf("day").toFormat("yyyy-MM-dd'T'HH:mm")}
      />
    </label>

    <label class="input w-sm input-sm">
      <span class="label flex-1">{m.final_reference_date_label()}</span>
      <input
        type="datetime-local"
        class="w-auto flex-1"
        value={chartStore.to}
        onchange={(e) => (chartStore.to = e.currentTarget.value)}
        required
        step="1"
        min={DateTime.now().minus({ years: 5 }).startOf("day").toFormat("yyyy-MM-dd'T'HH:mm")}
        max={DateTime.now().plus({ days: 1 }).startOf("day").toFormat("yyyy-MM-dd'T'HH:mm")}
      />
    </label>
  </div>
</div>
