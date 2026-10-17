<script lang="ts">
  import { chartStore } from "@/charts/chart.svelte"
  import { m } from "@/shared/paraglide/messages"

  interface Props {
    showScale?: boolean
    showGroup?: boolean
  }

  const { showScale = false, showGroup = false }: Props = $props()
</script>

<div class="justify-between px-24 card flex-row card-border p-2 bg-base-100 border-base-300 mt-2">
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
        class="w-auto shrink-0"
        value={chartStore.from}
        onchange={(e) => (chartStore.from = e.currentTarget.value)}
        required
        step="1"
      />
    </label>

    <label class="input w-sm input-sm">
      <span class="label flex-1">{m.final_reference_date_label()}</span>
      <input
        type="datetime-local"
        class="w-auto shrink-0"
        value={chartStore.to}
        onchange={(e) => (chartStore.to = e.currentTarget.value)}
        required
        step="1"
      />
    </label>
  </div>
</div>
