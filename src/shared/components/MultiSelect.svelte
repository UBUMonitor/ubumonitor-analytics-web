<script lang="ts">
  import type { SelectableItem } from "@/shared/types/selectable-item"

  interface Props {
    items: SelectableItem[]
    ariaLabel: string
    onToggle: (item: SelectableItem, checked: boolean) => void
  }

  const uid = $props.id()
  let { items, ariaLabel, onToggle }: Props = $props()
</script>

<button
  type="button"
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
          <span>{item.name}</span>
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            checked={item.checked}
            onchange={(event) => onToggle(item, event.currentTarget.checked)}
          />
        </label>
      </li>
    {/each}
  </ul>
{/if}
