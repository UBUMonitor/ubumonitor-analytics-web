<script lang="ts">
  import UserItem from "@/dashboard/components/UserItem.svelte"
  import { dashboardStore, getFilteredUsers } from "@/dashboard/dashboard.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { GraduationCapIcon, UsersIcon } from "@lucide/svelte"
</script>

<div class="flex h-full flex-col">
  <div class="flex justify-end gap-2 p-0.5">
    <GraduationCapIcon class="h-full" />
    <MultiSelect items={dashboardStore.roleItems} ariaLabel={m.roles_label()} />
  </div>
  <div class="flex justify-end gap-2 p-0.5">
    <UsersIcon class="h-full" />
    <MultiSelect items={dashboardStore.groupItems} ariaLabel={m.groups_label()} />
  </div>
  <Select component={UserItem} items={getFilteredUsers()} ariaLabel={m.users_label()} />
</div>
