<script lang="ts">
  import type { Item } from "@/lib/appStore.svelte"

  interface Props {
    items: Item[]
  }

  const uid = $props.id()
  let { items }: Props = $props()
</script>

<button
  class="select w-24 select-sm"
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
