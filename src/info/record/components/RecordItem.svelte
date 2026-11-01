<script lang="ts">
  import type { SelectableItem } from "@/shared/types/selectable-item"

  interface Props {
    item: SelectableItem & { modName?: string }
  }

  const { item }: Props = $props()
</script>

<div class="flex h-8 items-center gap-1 p-0.5">
  {#if item.modName}
    <img class="h-full" src="/icons/{item.modName}.svg" alt="" />
  {/if}
  <span class="w-full truncate">{item.name}</span>
</div>
