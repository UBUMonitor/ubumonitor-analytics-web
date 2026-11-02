<script lang="ts">
  import type { UserItem } from "@/features/users/user.svelte"
  import { m } from "@/shared/paraglide/messages"

  interface Props {
    item: UserItem
  }

  let { item }: Props = $props()

  const lastAccessLabel = $derived(item.lastAccess?.toRelative() ?? m.not_available())
  const lastCourseAccessLabel = $derived(item.lastCourseAccess?.toRelative() ?? m.not_available())
</script>

<div class="flex h-14 gap-2">
  <img class="m-1 aspect-square rounded-box" src={item.imageUrl} alt="" />
  <div class="flex flex-col">
    <span class="truncate font-bold">{item.name}</span>
    <span class="truncate text-xs">
      {m.last_access()}: {lastAccessLabel}
    </span>
    <span class="truncate text-xs">
      {m.last_course_access()}: {lastCourseAccessLabel}
    </span>
  </div>
</div>
