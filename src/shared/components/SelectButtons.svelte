<script lang="ts">
  import { m } from "../paraglide/messages"
  import type { Item } from "@/dashboard/dashboard.svelte"
  import { ListChecksIcon, ListIcon } from "@lucide/svelte"
  import type { ClassValue } from "svelte/elements"

  interface Props {
    class?: ClassValue
    items: Item[]
  }

  let { items, class: className }: Props = $props()

  const setAll = (checked: boolean) => {
    for (const item of items) item.checked = checked
  }
</script>

<div class={["flex gap-1", className]}>
  <button class="btn btn-square btn-sm" title={m.select_all()} onclick={() => setAll(true)}>
    <ListChecksIcon />
  </button>

  <button class="btn btn-square btn-sm" title={m.deselect_all()} onclick={() => setAll(false)}>
    <ListIcon />
  </button>
</div>
