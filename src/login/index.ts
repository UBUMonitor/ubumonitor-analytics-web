import { authLogout, authSSO } from "@/backend/services/auth"
import { authLogin } from "@/backend/services/auth"
import { getPublicSiteInfo, syncSiteInfo } from "@/backend/services/sites"
import { loginStore } from "@/login/login.svelte"
import { invoke } from "@tauri-apps/api/core"
import { once, type UnlistenFn } from "@tauri-apps/api/event"

export async function validateHost(host: string) {
  const siteInfo = await getPublicSiteInfo({ host })
  return siteInfo.site
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

  loginStore.token = loginResponse.accessToken

  const siteInfoResponse = await syncSiteInfo()

  loginStore.userId = siteInfoResponse.user.id
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
  return new Promise<void>((resolve, reject) => {
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

        loginStore.token = response.accessToken
        const siteInfoResponse = await syncSiteInfo()
        loginStore.userId = siteInfoResponse.user.id

        resolve()
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
        reject(new Error("Login cancelado por el usuario"))
      })

      await invoke("open_moodle_login", { loginUrl: launchUrl })
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
  loginStore.userId = null
}
