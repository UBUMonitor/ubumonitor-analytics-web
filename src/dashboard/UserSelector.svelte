<script lang="ts">
  import MultiSelect from "@/components/MultiSelect.svelte"
  import Select from "@/components/Select.svelte"
  import UserItem from "@/dashboard/UserItem.svelte"
  import { appStore, getFilteredUsers } from "@/lib/appStore.svelte"
  import { GraduationCapIcon, UsersIcon } from "@lucide/svelte"
</script>

<div class="flex h-full flex-col">
  <div class="flex justify-end gap-2 p-0.5">
    <GraduationCapIcon class="h-full" />
    <MultiSelect items={appStore.roleItems} />
  </div>
  <div class="flex justify-end gap-2 p-0.5">
    <UsersIcon class="h-full" />
    <MultiSelect items={appStore.groupItems} />
  </div>
  <Select component={UserItem} items={getFilteredUsers()} />
</div>
