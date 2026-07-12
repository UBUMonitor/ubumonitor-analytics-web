import { relaunch } from "@tauri-apps/plugin-process"
import { check } from "@tauri-apps/plugin-updater"

export async function checkForUpdates() {
  try {
    const update = await check()

    if (update) {
      console.log(`Update found: ${update.version}, notes: ${update.body}`)

      let downloaded = 0
      let contentLength = 0

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0
            console.log(`Downloading update, size: ${contentLength}`)
            break
          case "Progress":
            downloaded += event.data.chunkLength
            console.log(`Downloaded ${downloaded} / ${contentLength}`)
            break
          case "Finished":
            console.log("Download finished, installing...")
            break
        }
      })

      console.log("Update installed, restarting app")
      await relaunch()
    } else {
      console.log("No update available")
    }
  } catch (e) {
    console.error("Error checking for updates:", e)
  }
}
