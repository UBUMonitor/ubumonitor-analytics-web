<script lang="ts">
  import CourseSelector from "@/header/components/CourseSelector.svelte"
  import LogoutButton from "@/header/components/LogoutButton.svelte"
  import SyncButton from "@/header/components/SyncButton.svelte"
</script>

<header class="navbar min-h-fit bg-primary">
  <h1 class="navbar-start font-bold text-primary-content">UBUMonitor</h1>
  <div class="navbar-center gap-2">
    <CourseSelector />
    <SyncButton />
  </div>
  <div class="navbar-end gap-4">
    <LogoutButton />
  </div>
</header>
