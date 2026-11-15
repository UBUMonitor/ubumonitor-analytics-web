<script lang="ts">
  import Dialog from "@/components/dialogs/Dialog.svelte"
  import UpdateDialog from "@/components/dialogs/UpdateDialog.svelte"
  import Login from "@/components/login/Login.svelte"
  import { dialogStore } from "@/stores/dialog.svelte"
  import { loginStore } from "@/stores/login.svelte"
  import { check } from "@tauri-apps/plugin-updater"
  import { Toaster } from "svelte-sonner"

  const dashboard = import("@/components/Dashboard.svelte")

  check().then((update) => update && dialogStore.openDialog(UpdateDialog, { update }))
</script>

{#if !loginStore.token}
  <Login />
{:else}
  {#await dashboard then { default: Dashboard }}
    <Dashboard />
  {/await}
{/if}
<Dialog />
<Toaster richColors position="top-center" />
