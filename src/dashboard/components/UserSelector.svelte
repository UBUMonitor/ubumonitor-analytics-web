<script lang="ts">
  import UserItem from "@/dashboard/components/UserItem.svelte"
  import {
    dashboardStore,
    getFilteredUsers,
    getSelectedUsers,
    LAST_ACCESS_INTERVALS,
  } from "@/dashboard/dashboard.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { m } from "@/shared/paraglide/messages"
  import {
    ClockIcon,
    FunnelIcon,
    GraduationCapIcon,
    UserCheckIcon,
    UsersIcon,
  } from "@lucide/svelte"
</script>

<div class="card flex min-h-0 flex-1 flex-col border-base-300 bg-base-100 p-1 card-border">
  <div
    class="grid grid-flow-col grid-rows-3 grid-cols-[1fr_fit-content(100%)] gap-1 p-1 border-b border-base-200"
  >
    <div class="flex gap-1 self-center">
      <div class="badge badge-sm badge-soft font-bold px-1">
        <FunnelIcon class="size-full p-0.5" />
        {getFilteredUsers().length}
      </div>
      <div class="badge badge-sm badge-soft font-bold px-1">
        <UsersIcon class="size-full p-0.5" />
        {dashboardStore.userItems.length}
      </div>
      <div class="badge badge-sm badge-soft badge-success font-bold px-1">
        <UserCheckIcon class="size-full p-0.5" />
        {getSelectedUsers().length}
      </div>
    </div>

    <input
      class="input input-sm w-40"
      name="filter"
      type="text"
      placeholder={m.filter_label()}
      bind:value={dashboardStore.nameFilter}
    />

    <SelectButtons items={getFilteredUsers()} />

    <div class="flex gap-1">
      <GraduationCapIcon class="h-full" />
      <MultiSelect items={dashboardStore.roleItems} ariaLabel={m.roles_label()} />
    </div>

    <div class="flex gap-1">
      <UsersIcon class="h-full" />
      <MultiSelect items={dashboardStore.groupItems} ariaLabel={m.groups_label()} />
    </div>

    <div class="flex gap-1">
      <ClockIcon class="h-full" />
      <MultiSelect items={LAST_ACCESS_INTERVALS} ariaLabel={m.last_access_label()} />
    </div>
  </div>
  <Select component={UserItem} items={getFilteredUsers()} ariaLabel={m.users_label()} />
</div>
