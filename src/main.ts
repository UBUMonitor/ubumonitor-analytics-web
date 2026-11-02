import App from "@/App.svelte"
import "@/app.css"
import { queryClient } from "@/shared/api/queryClient"
import { settingsStore } from "@/shared/lib/settings.svelte"
import { mount } from "svelte"

const target = document.getElementById("app")
if (!target) throw new Error('Required mount element "#app" was not found')

const start = async () => {
  let settingsError: unknown
  try {
    await settingsStore.initialize()
  } catch (error) {
    settingsError = error
  }

  return mount(App, {
    target,
    props: { queryClient, settingsError },
  })
}

export default start()
