<script lang="ts" generics="T extends Item">
  import { type Item } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"
  import { ListChecksIcon, ListIcon } from "@lucide/svelte"
  import type { Component } from "svelte"

  interface Props {
    component: Component<T>
    items: T[]
  }

  let { items, component: ItemComponent }: Props = $props()

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

<div class="flex h-full min-h-0 flex-col bg-base-100">
  <div class="flex gap-1 p-1">
    <button class="btn btn-square btn-sm" title={m.select_all()} onclick={() => setAll(true)}>
      <ListChecksIcon />
    </button>

    <button class="btn btn-square btn-sm" title={m.deselect_all()} onclick={() => setAll(false)}>
      <ListIcon />
    </button>
  </div>
  <div class="list overflow-y-auto" role="listbox" tabindex="-1" onkeydown={handleKeydown}>
    {#each items as item (item.id)}
      <label class="cursor-pointer select-none has-checked:bg-accent">
        <input class="hidden" type="checkbox" bind:checked={item.checked} id={item.id.toString()} />
        <ItemComponent {...item} />
      </label>
    {/each}
  </div>
</div>
