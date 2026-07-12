<script lang="ts">
  import { appStore, getFilteredUsers } from "@/lib/appStore.svelte"
  import { GraduationCapIcon, UsersIcon } from "@lucide/svelte"
  import MultiSelect from "./MultiSelect.svelte"
  import Select from "./Select.svelte"
  import UserItem from "./UserItem.svelte"
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
