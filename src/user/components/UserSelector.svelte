<script lang="ts">
  import { courseStore } from "@/dashboard/course.svelte"
  import MultiSelect from "@/shared/components/MultiSelect.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { setChecked } from "@/shared/lib/selection"
  import { m } from "@/shared/paraglide/messages"
  import UserItem from "@/user/components/UserItem.svelte"
  import { userStore, type UserItem as UserItemData } from "@/user/user.svelte"
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
      bind:value={userStore.nameFilter}
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
    loading={courseStore.isSyncing ? skeleton : undefined}
  />
</div>

{#snippet skeleton()}
  <div class="flex animate-pulse flex-col overflow-hidden">
    {#each { length: 10 }, i (i)}
      <div class="flex h-14 gap-2">
        <div class="m-1 aspect-square h-12 shrink-0 skeleton rounded-box"></div>
        <div class="flex flex-col justify-center gap-1">
          <div class="h-4 w-20 skeleton"></div>
          <div class="h-3 w-36 skeleton"></div>
          <div class="h-3 w-36 skeleton"></div>
        </div>
      </div>
    {/each}
  </div>
{/snippet}

{#snippet userItem(user: UserItemData)}
  <UserItem item={user} />
{/snippet}
