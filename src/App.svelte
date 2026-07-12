<script lang="ts">
  import Dashboard from "@/components/dashboard/Dashboard.svelte"
  import Header from "@/components/header/Header.svelte"
  import Login from "@/components/Login.svelte"
  import SetUp from "@/components/SetUp.svelte"
  import { getUserId } from "@/lib/sessionStore.svelte"

  const userId = $derived(getUserId())

  let done = $state(false)
</script>

<div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden">
  <Header />
  <main class="flex flex-1 items-center justify-center overflow-hidden">
    {#if !done}
      <SetUp bind:done />
    {:else if userId}
      <Dashboard />
    {:else}
      <Login />
    {/if}
  </main>
</div>
