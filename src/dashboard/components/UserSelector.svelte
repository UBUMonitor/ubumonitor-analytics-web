<script lang="ts">
  import UserItem from "@/dashboard/components/UserItem.svelte"
  import { dashboardStore, getFilteredUsers } from "@/dashboard/dashboard.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { GraduationCapIcon, UsersIcon } from "@lucide/svelte"
</script>

<div class="card flex min-h-0 flex-1 flex-col border-base-300 bg-base-100 p-1 card-border">
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
