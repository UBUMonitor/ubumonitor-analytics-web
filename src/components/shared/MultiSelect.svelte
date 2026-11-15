<script lang="ts" generics="T extends SelectableItem">
  import type { SelectableItem } from "@/utils/utils"
  import type { Snippet } from "svelte"

  interface Props {
    items: T[]
    ariaLabel: string
    children: Snippet<[T]>
  }

  const uid = $props.id()
  let { items, ariaLabel, children }: Props = $props()
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
    class="menu dropdown dropdown-end rounded-box bg-base-100 p-1 shadow-sm"
    popover
    id="popover-{uid}"
    style="position-anchor:--anchor-{uid}"
  >
    {#each items as item (item.id)}
      <li>
        <label class="label justify-between gap-2">
          {@render children(item)}
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            bind:checked={item.checked}
          />
        </label>
      </li>
    {/each}
  </ul>
{/if}
