<script lang="ts">
  import Start from "@/app/Start.svelte"
  import Dashboard from "@/dashboard/components/Dashboard.svelte"
  import Header from "@/header/components/Header.svelte"
  import Login from "@/login/components/Login.svelte"
  import { loginStore } from "@/login/login.svelte"

  let done = $state(false)
</script>

<div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden">
  <Header />
  <main class="flex flex-1 overflow-hidden">
    {#if !done}
      <Start bind:done />
    {:else if !loginStore.userId}
      <Login />
    {:else}
      <Dashboard />
    {/if}
  </main>
</div>
