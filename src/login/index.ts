import BackendErrorDialog from "@/app/BackendErrorDialog.svelte"
import { authLogout, authSSO } from "@/backend/services/auth"
import { authLogin } from "@/backend/services/auth"
import { syncUserEnrollments } from "@/backend/services/user-enrollments"
import { updateCourses } from "@/dashboard/course"
import { openDialog } from "@/dialog/dialog.svelte"
import { loginStore } from "@/login/login.svelte"
import { healthCheck } from "@/shared/lib/orvalFetch"
import { m } from "@/shared/paraglide/messages"
import { invoke } from "@tauri-apps/api/core"
import { once, type UnlistenFn } from "@tauri-apps/api/event"
import { info } from "@tauri-apps/plugin-log"

export interface SiteInfo {
  siteName: string
  siteVersion?: string
  siteUrl: string
  typeOfLogin: TypeOfLogin
  launchUrl?: string
  enableMobileWebService?: boolean
  enableWebServices?: boolean
  maintenanceEnabled?: boolean
  maintenanceMessage?: string
}

export type TypeOfLogin = "APP" | "BROWSER" | "EMBEDDED" | "UNKNOWN"

export async function validateHost(host: string) {
  return invoke<SiteInfo>("get_public_moodle_config", { host })
}

const backendUp = healthCheck()
  .then(() => {
    info("Backend up")
  })
  .catch(() => {
    openDialog(BackendErrorDialog)
    throw Error("Backend failed")
  })

export async function login(token: Promise<string>) {
  await backendUp

  loginStore.token = await token

  updateCourses(syncUserEnrollments())
}

export async function appLogin(
  username: string,
  password: string,
  dbPassword: string,
  host: string,
) {
  const loginResponse = await authLogin({
    username,
    password,
    dbPassword,
    host,
  })

  return loginResponse.accessToken
}

export interface CookieInfo {
  name: string
  value: string
  domain?: string
  path?: string
  secure?: boolean
  http_only?: boolean
}

export interface MoodleLoginPayload {
  url: string
  cookies: CookieInfo[]
}

export async function loginWeb(host: string, dbPassword: string, launchUrl: string) {
  return new Promise<string>((resolve, reject) => {
    let unlistenToken: UnlistenFn
    let unlistenCancelled: UnlistenFn

    const cleanup = () => {
      unlistenToken?.()
      unlistenCancelled?.()
    }

    const handleToken = async (moodle: MoodleLoginPayload) => {
      cleanup()
      try {
        const response = await authSSO({
          host,
          moodleLaunchCredential: moodle.url,
          dbPassword,
          cookies: moodle.cookies.map(({ name, value }) => ({ name, value })),
        })

        resolve(response.accessToken)
      } catch (err) {
        reject(err)
      }
    }

    const setup = async () => {
      unlistenToken = await once<MoodleLoginPayload>("moodle-token-received", (event) =>
        handleToken(event.payload),
      )

      unlistenCancelled = await once<void>("moodle-login-cancelled", () => {
        cleanup()
        reject(new Error(m.login_cancelled_error()))
      })

      await invoke("open_moodle_login", {
        loginUrl: launchUrl,
      })
    }

    setup().catch((err) => {
      cleanup()
      reject(err)
    })
  })
}

export async function logout() {
  await authLogout()
  loginStore.token = null
}
