<script lang="ts">
  import Dashboard from "@/dashboard/Dashboard.svelte"
  import Header from "@/header/Header.svelte"
  import { appStore } from "@/lib/appStore.svelte"
  import Login from "@/login/Login.svelte"
  import Start from "@/setup/Start.svelte"

  let done = $state(false)
</script>

<div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden">
  <Header />
  <main class="flex flex-1 overflow-hidden">
    {#if !done}
      <Start bind:done />
    {:else if !appStore.userId}
      <Login />
    {:else}
      <Dashboard />
    {/if}
  </main>
</div>
