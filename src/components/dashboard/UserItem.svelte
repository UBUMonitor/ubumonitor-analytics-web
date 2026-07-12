<script lang="ts">
  import type { UserItem } from "@/lib/appStore.svelte"
  import { formatRelativeTime } from "@/lib/utils"
  import { m } from "@/paraglide/messages"

  let { imageUrl, name, lastAccess, lastCourseAccess }: UserItem = $props()

  const lastAccessLabel = $derived(formatRelativeTime(lastAccess))
  const lastCourseAccessLabel = $derived(formatRelativeTime(lastCourseAccess))
</script>

<div class="flex h-14 gap-2">
  <img class="m-1 rounded-box" src={imageUrl} alt={name} />

  <div class="flex min-w-0 flex-col">
    <span class="truncate font-bold">{name ?? "N/A"}</span>
    <span class="truncate text-xs">
      {m.last_access_label()}:
      {lastAccessLabel}
    </span>
    <span class="truncate text-xs">
      {m.last_course_access_label()}:
      {lastCourseAccessLabel}
    </span>
  </div>
</div>
