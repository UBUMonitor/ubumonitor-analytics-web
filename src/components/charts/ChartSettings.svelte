<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"

  interface Props {
    showScale?: boolean
    showGroup?: boolean
  }

  const { showScale = false, showGroup = false }: Props = $props()
</script>

<div class="flex justify-between bg-secondary px-24 py-1">
  <div class="flex flex-col gap-2">
    {#if showScale}
      <label class="input input-sm">
        <span class="label">{m.max_scale_label()}</span>
        <input type="number" bind:value={appStore.scale} step="10" min="10" />
      </label>
    {/if}
    {#if showGroup}
      <label class="select select-sm">
        <span class="label">{m.group_by_label()}</span>
        <select bind:value={appStore.group}>
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
    <label class="input input-sm w-sm">
      <span class="label flex-1">{m.initial_reference_date_label()}</span>
      <input
        type="datetime-local"
        class="w-auto shrink-0"
        bind:value={appStore.from}
        required
        step="1"
      />
    </label>

    <label class="input input-sm w-sm">
      <span class="label flex-1">{m.final_reference_date_label()}</span>
      <input
        type="datetime-local"
        class="w-auto shrink-0"
        bind:value={appStore.to}
        required
        step="1"
      />
    </label>
  </div>
</div>
