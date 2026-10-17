<script lang="ts">
  import UpdateDialog from "@/app/UpdateDialog.svelte"
  import Dialog from "@/dialog/components/Dialog.svelte"
  import { openDialog } from "@/dialog/dialog.svelte"
  import Header from "@/header/components/Header.svelte"
  import Login from "@/login/components/Login.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"

  const dashboard = import("@/dashboard/components/Dashboard.svelte")

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
    {#if !loginStore.userId}
      <Login />
    {:else}
      {#await dashboard then { default: Dashboard }}
        <Dashboard />
      {/await}
    {/if}
  </main>
</div>
<Dialog />
