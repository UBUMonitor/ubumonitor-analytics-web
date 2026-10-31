<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import type { UserItem } from "@/user/user.svelte"

  let { imageUrl, name, lastAccess, lastCourseAccess }: UserItem = $props()

  const lastAccessLabel = $derived(lastAccess?.toRelative() ?? m.not_available())
  const lastCourseAccessLabel = $derived(lastCourseAccess?.toRelative() ?? m.not_available())
</script>

<div class="flex h-14 gap-2">
  <img class="m-1 aspect-square rounded-box" src={imageUrl} alt={name} />
  <div class="flex flex-col">
    <span class="truncate font-bold">{name}</span>
    <span class="truncate text-xs">
      {m.last_access()}:
      {lastAccessLabel}
    </span>
    <span class="truncate text-xs">
      {m.last_course_access()}:
      {lastCourseAccessLabel}
    </span>
  </div>
</div>
