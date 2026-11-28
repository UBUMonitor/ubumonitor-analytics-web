<script lang="ts">
  import type { CellProps } from "@/services/display/table"
  import { usersStore } from "@/stores/users.svelte"

  let { value, row }: CellProps = $props()

  const user = $derived(usersStore.usersMap.get(row.userId as number)!)
  const name = $derived(String(value ?? ""))
</script>

<div class="flex items-center gap-2">
  <div class="avatar">
    <div class="size-6 rounded">
      <img src={user.imageUrl} alt="" />
    </div>
  </div>
  <span class="min-w-0 truncate" title={name}>{name}</span>
</div>
