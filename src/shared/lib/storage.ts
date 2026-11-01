export type StorageResult<T> = { ok: true; value: T } | { ok: false; error: Error }

export function readStorageItem(key: string): StorageResult<string | null> {
  try {
    return { ok: true, value: localStorage.getItem(key) }
  } catch (error) {
    return {
      ok: false,
      error: new Error(`Unable to read local storage key "${key}"`, { cause: error }),
    }
  }
}

export function writeStorageItem(key: string, value: string): StorageResult<void> {
  try {
    localStorage.setItem(key, value)
    return { ok: true, value: undefined }
  } catch (error) {
    return {
      ok: false,
      error: new Error(`Unable to write local storage key "${key}"`, { cause: error }),
    }
  }
}
