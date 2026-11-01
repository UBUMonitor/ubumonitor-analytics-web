<script lang="ts">
  import type { SelectableItem } from "@/shared/types/selectable-item"

  interface Props {
    item: SelectableItem
  }

  const { item }: Props = $props()
</script>

<div class="flex h-8 items-center p-1">
  <span class="w-full truncate">{item.name}</span>
</div>
