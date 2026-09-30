<script lang="ts">
  import CourseSelector from "@/header/CourseSelector.svelte"
  import LogoutButton from "@/header/LogoutButton.svelte"
  import SyncButton from "@/header/SyncButton.svelte"
  import { appStore } from "@/lib/appStore.svelte"
</script>

<header class="navbar min-h-fit bg-primary">
  <h1 class="navbar-start font-bold text-primary-content">UBUMonitor</h1>
  {#if appStore.userId}
    <div class="navbar-center gap-2">
      <CourseSelector />
      <SyncButton />
    </div>
  {/if}
  <div class="navbar-end gap-4">
    <LogoutButton />
  </div>
</header>
