<script lang="ts">
  import Start from "@/app/Start.svelte"
  import UpdateDialog from "@/app/UpdateDialog.svelte"
  import Dialog from "@/dialog/components/Dialog.svelte"
  import { openDialog } from "@/dialog/dialog.svelte"
  import Header from "@/header/components/Header.svelte"
  import Login from "@/login/components/Login.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"

  const dashboard = import("@/dashboard/components/Dashboard.svelte")

  let done = $state(false)

  onMount(() => {
    check().then((update) => {
      if (update) {
        openDialog(UpdateDialog, { update })
      }
    })
  })
</script>

<div class="flex h-screen max-h-screen w-screen max-w-screen flex-col overflow-hidden">
  <Header />
  <main class="flex flex-1 overflow-hidden">
    {#if !done}
      <Start bind:done />
    {:else if !loginStore.userId}
      <Login />
    {:else}
      {#await dashboard then { default: Dashboard }}
        <Dashboard />
      {/await}
    {/if}
  </main>
</div>
<Dialog />
