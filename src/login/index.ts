import type { PublicSiteInfoResponseDto } from "@/backend/model"
import { authLogout, authSSO } from "@/backend/services/auth"
import { syncSiteInfo } from "@/backend/services/sites"
import { loginStore } from "@/login/login.svelte"
import { m } from "@/shared/paraglide/messages"
import { invoke } from "@tauri-apps/api/core"
import { once, type UnlistenFn } from "@tauri-apps/api/event"

export async function validateHost(host: string) {
  const siteInfo = await invoke<PublicSiteInfoResponseDto>("get_public_config", { host })
  return siteInfo.site
}

export async function appLogin(
  username: string,
  password: string,
  dbPassword: string,
  host: string,
) {
  const loginResponse = await invoke("auth_login", {
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
        reject(new Error(m.login_cancelled_error()))
      })

      await invoke("open_moodle_login", {
        loginUrl: launchUrl,
        windowTitle: m.login_window_title(),
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
  loginStore.userId = null
}
