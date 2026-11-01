<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import type { SelectableItem } from "@/shared/types/selectable-item"
  import { ListChecksIcon, ListIcon } from "@lucide/svelte"
  import type { ClassValue } from "svelte/elements"

  interface Props {
    class?: ClassValue
    items: SelectableItem[]
    onToggleAll: (items: SelectableItem[], checked: boolean) => void
  }

  let { items, class: className, onToggleAll }: Props = $props()
</script>

<div class={["flex gap-1", className]}>
  <button
    type="button"
    class="btn btn-square btn-sm"
    title={m.select_all()}
    onclick={() => onToggleAll(items, true)}
  >
    <ListChecksIcon />
  </button>

  <button
    type="button"
    class="btn btn-square btn-sm"
    title={m.deselect_all()}
    onclick={() => onToggleAll(items, false)}
  >
    <ListIcon />
  </button>
</div>
