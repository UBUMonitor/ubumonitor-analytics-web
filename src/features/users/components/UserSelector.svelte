<script lang="ts">
  import UserItem from "@/features/users/components/UserItem.svelte"
  import { userStore, type UserItem as UserItemData } from "@/features/users/user.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { setChecked } from "@/shared/lib/selection"
  import { m } from "@/shared/paraglide/messages"
  import {
    ClockIcon,
    FunnelIcon,
    GraduationCapIcon,
    UserCheckIcon,
    UsersIcon,
  } from "@lucide/svelte"

  const toggleItem = (item: { checked: boolean }, checked: boolean) => (item.checked = checked)
</script>

<div class="card flex min-h-0 flex-1 flex-col border-base-300 bg-base-100 p-1 card-border">
  <div
    class="grid grid-flow-col grid-cols-[1fr_fit-content(100%)] grid-rows-3 gap-1 border-b border-base-200 p-1"
  >
    <div class="flex gap-1 self-center">
      <div class="badge badge-soft px-1 badge-sm font-bold">
        <FunnelIcon class="size-full p-0.5" />
        {userStore.filtered.length}
      </div>
      <div class="badge badge-soft px-1 badge-sm font-bold">
        <UsersIcon class="size-full p-0.5" />
        {userStore.userItems.length}
      </div>
      <div class="badge badge-soft px-1 badge-sm font-bold badge-success">
        <UserCheckIcon class="size-full p-0.5" />
        {userStore.selected.length}
      </div>
    </div>

    <input
      class="input w-40 input-sm"
      name="filter"
      type="search"
      autocomplete="off"
      placeholder={m.filter()}
      value={userStore.nameFilter}
      oninput={(event) => (userStore.nameFilter = event.currentTarget.value)}
    />

    <SelectButtons items={userStore.filtered} onToggleAll={setChecked} />

    <div class="flex gap-1">
      <GraduationCapIcon class="h-full" />
      <MultiSelect items={userStore.roleItems} ariaLabel={m.roles()} onToggle={toggleItem} />
    </div>

    <div class="flex gap-1">
      <UsersIcon class="h-full" />
      <MultiSelect items={userStore.groupItems} ariaLabel={m.groups()} onToggle={toggleItem} />
    </div>

    <div class="flex gap-1">
      <ClockIcon class="h-full" />
      <MultiSelect
        items={userStore.lastAccessItems}
        ariaLabel={m.last_access()}
        onToggle={toggleItem}
      />
    </div>
  </div>
  <Select
    item={userItem}
    items={userStore.filtered}
    ariaLabel={m.users()}
    onToggle={toggleItem}
    onToggleAll={setChecked}
  />
</div>

{#snippet userItem(user: UserItemData)}
  <UserItem item={user} />
{/snippet}
