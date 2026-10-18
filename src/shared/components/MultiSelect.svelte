<script lang="ts">
  import type { Item } from "@/dashboard/dashboard.svelte"

  interface Props {
    items: Item[]
    ariaLabel: string
  }

  const uid = $props.id()
  let { items, ariaLabel }: Props = $props()
</script>

<button
  class="select w-20 select-sm"
  aria-label={ariaLabel}
  title={ariaLabel}
  popovertarget="popover-{uid}"
  style="anchor-name:--anchor-{uid}"
>
  <span>({items.filter(({ checked }) => checked).length}/{items.length})</span>
</button>

{#if items.length > 0}
  <ul
    class="menu dropdown dropdown-end z-1 rounded-box bg-base-100 p-2 shadow-sm"
    popover
    id="popover-{uid}"
    style="position-anchor:--anchor-{uid}"
  >
    {#each items as item (item.id)}
      <li>
        <label class="label justify-between gap-2">
          <span>{item.name}</span>
          <input
            id={item.id.toString()}
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            bind:checked={item.checked}
          />
        </label>
      </li>
    {/each}
  </ul>
{/if}
