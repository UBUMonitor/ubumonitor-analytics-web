import { loginStore } from "@/features/auth/login.svelte"
import { resetCourseData } from "@/features/course/course"
import { courseStore } from "@/features/course/course.svelte"
import { displayStore } from "@/features/display/display.svelte"
import { runSyncMutation } from "@/features/sync/mutations"
import { authLogin, authLogout, authSSO } from "@/shared/api/services/auth"
import { getSyncUserEnrollmentsMutationOptions } from "@/shared/api/services/user-enrollments"
import { dialog } from "@/shared/components/dialog/dialog-state.svelte"
import { notifyError } from "@/shared/lib/notify"
import { m } from "@/shared/paraglide/messages"
import { invoke } from "@tauri-apps/api/core"
import { once, type UnlistenFn } from "@tauri-apps/api/event"

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

export async function login(token: Promise<string>) {
  loginStore.token = await token

  void runSyncMutation(getSyncUserEnrollmentsMutationOptions(), undefined)
    .then((enrollments) => courseStore.updateCourses(Promise.resolve(enrollments)))
    .catch(notifyError)
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
  resetCourseData()
  displayStore.reset()
  dialog.close()
}
