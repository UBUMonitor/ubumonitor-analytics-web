import BackendErrorDialog from "@/app/BackendErrorDialog.svelte"
import { authLogout, authSSO } from "@/backend/services/auth"
import { authLogin } from "@/backend/services/auth"
import { syncUserEnrollments } from "@/backend/services/user-enrollments"
import { courseStore } from "@/dashboard/course.svelte"
import { dialog, openDialog } from "@/dialog/dialog.svelte"
import { displayStore } from "@/display/display.svelte"
import { gradeStore } from "@/info/grade/grade.svelte"
import { recordStore } from "@/info/record/record.svelte"
import { loginStore } from "@/login/login.svelte"
import { healthCheck } from "@/shared/lib/orvalFetch"
import { m } from "@/shared/paraglide/messages"
import { userStore } from "@/user/user.svelte"
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

let backendUp: Promise<void> | undefined

export function ensureBackendUp() {
  backendUp ??= healthCheck()
    .then(() => {
      info("Backend up")
    })
    .catch((error: unknown) => {
      openDialog(BackendErrorDialog)
      throw new Error("Backend failed", { cause: error })
    })

  return backendUp
}

export async function login(token: Promise<string>) {
  await ensureBackendUp()

  loginStore.token = await token

  void courseStore.updateCourses(syncUserEnrollments())
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
  try {
    await authLogout()
  } finally {
    resetAll()
  }
}

export function resetAll() {
  loginStore.reset()
  courseStore.reset()
  userStore.reset()
  recordStore.reset()
  gradeStore.reset()
  displayStore.reset()
  dialog.close()
}
