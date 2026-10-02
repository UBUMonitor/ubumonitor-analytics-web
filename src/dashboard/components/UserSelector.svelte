<script lang="ts">
  import UserItem from "@/dashboard/components/UserItem.svelte"
  import { dashboardStore, getFilteredUsers } from "@/dashboard/dashboard.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import { GraduationCapIcon, UsersIcon } from "@lucide/svelte"
</script>

<div class="flex h-full flex-col">
  <div class="flex justify-end gap-2 p-0.5">
    <GraduationCapIcon class="h-full" />
    <MultiSelect items={dashboardStore.roleItems} />
  </div>
  <div class="flex justify-end gap-2 p-0.5">
    <UsersIcon class="h-full" />
    <MultiSelect items={dashboardStore.groupItems} />
  </div>
  <Select component={UserItem} items={getFilteredUsers()} />
</div>
