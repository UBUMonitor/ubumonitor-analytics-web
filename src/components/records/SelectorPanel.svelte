<script lang="ts" generics="T extends SelectableItem">
  import Select from "@/components/shared/Select.svelte"
  import SelectButtons from "@/components/shared/SelectButtons.svelte"
  import { m } from "@/paraglide/messages"
  import type { SelectableItem } from "@/utils/utils"
  import type { Snippet } from "svelte"

  interface Props {
    items: T[]
    ariaLabel: string
    filter: string
    isLoading: boolean
    // Only bind this when the list has a "hidden" toggle
    hidden?: boolean
    dimmed?: (item: T) => boolean
    isTree?: boolean
    row: Snippet<[T]>
  }

  let {
    items,
    ariaLabel,
    isLoading,
    filter = $bindable(),
    hidden = $bindable(),
    dimmed,
    isTree = false,
    row,
  }: Props = $props()
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="flex gap-4 px-1 py-2">
    <input
      class="input min-w-0 flex-1 input-sm"
      name="filter"
      type="search"
      autocomplete="off"
      placeholder={m.filter()}
      bind:value={filter}
    />
    {#if hidden !== undefined}
      <label class="label text-sm">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={hidden} />
        {m.hidden()}
      </label>
    {/if}
    <SelectButtons {items} />
  </div>

  {#if isLoading}
    {@render skeleton()}
  {:else}
    <Select class="border-t border-base-200" {items} {ariaLabel} {isTree}>
      {#snippet children(item)}
        <div
          class={[
            "flex h-8 w-full items-center gap-1 p-0.5",
            { "text-base-content/50": dimmed?.(item) },
          ]}
        >
          {@render row(item)}
        </div>
      {/snippet}
    </Select>
  {/if}
</div>

{#snippet skeleton()}
  <div class="flex animate-pulse flex-col overflow-hidden">
    {#each { length: 5 }, i (i)}
      <div class="m-1 h-6 w-48 shrink-0 skeleton"></div>
      <div class="m-1 h-6 w-40 shrink-0 skeleton"></div>
      <div class="m-1 h-6 w-56 shrink-0 skeleton"></div>
    {/each}
  </div>
{/snippet}
