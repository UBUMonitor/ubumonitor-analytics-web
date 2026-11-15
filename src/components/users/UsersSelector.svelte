<script lang="ts">
  import MultiSelect from "@/components/shared/MultiSelect.svelte"
  import Select from "@/components/shared/Select.svelte"
  import SelectButtons from "@/components/shared/SelectButtons.svelte"
  import { m } from "@/paraglide/messages"
  import { usersStore } from "@/stores/users.svelte"
  import { type NamedSelectableItem } from "@/utils/utils"
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
    class="grid grid-flow-col grid-cols-[1fr_fit-content(100%)] grid-rows-3 gap-1 border-b border-base-200 p-1"
  >
    <div class="flex gap-1 self-center">
      <div class="badge badge-soft px-1 badge-sm font-bold">
        <FunnelIcon class="size-full p-0.5" />
        {usersStore.filteredUsers.length}
      </div>
      <div class="badge badge-soft px-1 badge-sm font-bold">
        <UsersIcon class="size-full p-0.5" />
        {usersStore.users.length}
      </div>
      <div class="badge badge-soft px-1 badge-sm font-bold badge-success">
        <UserCheckIcon class="size-full p-0.5" />
        {usersStore.selectedUsers.length}
      </div>
    </div>

    <input
      class="input w-40 input-sm"
      name="filter"
      type="search"
      autocomplete="off"
      placeholder={m.filter()}
      bind:value={usersStore.userFilter}
    />

    <SelectButtons items={usersStore.filteredUsers} />

    <div class="flex gap-1">
      <GraduationCapIcon class="h-full" />
      <MultiSelect items={usersStore.roles} ariaLabel={m.roles()} children={multiSelectChildren} />
    </div>

    <div class="flex gap-1">
      <UsersIcon class="h-full" />
      <MultiSelect
        items={usersStore.groups}
        ariaLabel={m.groups()}
        children={multiSelectChildren}
      />
    </div>

    <div class="flex gap-1">
      <ClockIcon class="h-full" />
      <MultiSelect
        items={usersStore.connections}
        ariaLabel={m.last_access()}
        children={multiSelectChildren}
      />
    </div>
  </div>

  {#if usersStore.isLoading}
    {@render skeleton()}
  {:else}
    <Select items={usersStore.filteredUsers} ariaLabel={m.users()}>
      {#snippet children({ imageUrl, name, lastAccess, lastCourseAccess })}
        <div class="flex h-14 gap-2">
          <img class="m-1 aspect-square rounded-box" src={imageUrl} alt={name} />
          <div class="flex flex-col">
            <span class="truncate font-bold">{name}</span>
            <span class="truncate text-xs">
              {m.last_access()}:
              {lastAccess?.toRelative() ?? m.not_available()}
            </span>
            <span class="truncate text-xs">
              {m.last_course_access()}:
              {lastCourseAccess?.toRelative() ?? m.not_available()}
            </span>
          </div>
        </div>
      {/snippet}
    </Select>
  {/if}
</div>

{#snippet skeleton()}
  <div class="flex animate-pulse flex-col overflow-hidden">
    {#each { length: 10 }}
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

{#snippet multiSelectChildren({ name }: NamedSelectableItem)}
  <span>{name}</span>
{/snippet}
