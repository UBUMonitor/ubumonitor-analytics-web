<script lang="ts">
  import { getToken } from "@/lib/sessionStore.svelte"
  import CourseSelector from "./CourseSelector.svelte"
  import LocaleSelector from "./LocaleSelector.svelte"
  import LogoutButton from "./LogoutButton.svelte"
  import SyncButton from "./SyncButton.svelte"
</script>

<header class="navbar min-h-fit bg-primary">
  <h1 class="navbar-start font-bold text-primary-content">UBUMonitor</h1>
  {#if getToken()}
    <div class="navbar-center gap-2">
      <CourseSelector />
      <SyncButton />
    </div>
  {/if}
  <div class="navbar-end gap-4">
    <LocaleSelector />
    <LogoutButton />
  </div>
</header>
