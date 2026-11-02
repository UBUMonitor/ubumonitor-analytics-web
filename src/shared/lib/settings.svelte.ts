import { load, type Store } from "@tauri-apps/plugin-store"

class SettingsStore {
  private store: Store | undefined
  private values = $state<Record<string, string>>({})

  async initialize() {
    this.store = await load("settings.json", { autoSave: true })
    this.values = Object.fromEntries(await this.store.entries<string>())
  }

  get(key: string) {
    return this.values[key] ?? ""
  }

  async set(key: string, value: string) {
    if (!this.store) throw new Error("Settings have not been initialized.")
    this.values[key] = value
    await this.store.set(key, value)
  }
}

export const settingsStore = new SettingsStore()
