<script lang="ts" generics="T extends SelectableItem">
  import type { SelectableItem } from "@/shared/types/selectable-item"
  import type { Component } from "svelte"

  interface Props {
    component: Component<T>
    items: T[]
    ariaLabel: string
  }

  let { items, component: ItemComponent, ariaLabel }: Props = $props()

  const setAll = (checked: boolean) => {
    for (const item of items) item.checked = checked
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault()
      setAll(true)
    } else if (e.key === "Escape") {
      setAll(false)
    }
  }
</script>

<div
  class="list h-full scrollbar-thin overflow-y-auto rounded-b-box"
  role="listbox"
  aria-label={ariaLabel}
  tabindex="-1"
  onkeydown={handleKeydown}
>
  {#each items as item (item.id)}
    <label class="cursor-pointer select-none has-checked:bg-accent">
      <input class="hidden" type="checkbox" bind:checked={item.checked} id={item.id.toString()} />
      <ItemComponent {...item} />
    </label>
  {/each}
</div>
