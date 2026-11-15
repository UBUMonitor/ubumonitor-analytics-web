import App from "@/app/App.svelte"
import "@/app/app.css"
import { getLocale } from "@/paraglide/runtime"
import { Settings } from "luxon"
import { mount } from "svelte"

Settings.defaultLocale = getLocale()

const app = mount(App, {
  target: document.getElementById("app")!,
})

export default app
