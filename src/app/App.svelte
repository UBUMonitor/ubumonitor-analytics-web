<script lang="ts">
  import Start from "@/app/Start.svelte"
  import UpdateDialog from "@/app/UpdateDialog.svelte"
  import Dialog from "@/dialog/components/Dialog.svelte"
  import { openDialog } from "@/dialog/dialog.svelte"
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

<div class="flex h-screen max-h-screen w-screen max-w-screen overflow-hidden bg-base-200 p-2">
  {#if !done}
    <Start bind:done />
  {:else if !loginStore.userId}
    <Login />
  {:else}
    {#await dashboard then { default: Dashboard }}
      <Dashboard />
    {/await}
  {/if}
</div>
<Dialog />
