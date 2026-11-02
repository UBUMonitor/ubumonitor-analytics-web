import { readStorageItem, writeStorageItem } from "@/shared/lib/storage"
import { warn } from "@tauri-apps/plugin-log"

export function loadSetting(key: string): string {
  const result = readStorageItem(key)
  if (!result.ok) {
    void warn(`Failed to read setting "${key}" from local storage`)
    return ""
  }

  return result.value ?? ""
}

export function saveSetting(key: string, value: string): void {
  const result = writeStorageItem(key, value)
  if (!result.ok) void warn(`Failed to save setting "${key}" to local storage`)
}
