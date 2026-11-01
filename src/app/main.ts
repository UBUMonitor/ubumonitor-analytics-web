import App from "@/app/App.svelte"
import "@/app/app.css"
import { mount } from "svelte"

const target = document.getElementById("app")
if (!target) throw new Error('Required mount element "#app" was not found')

const app = mount(App, {
  target,
})

export default app
