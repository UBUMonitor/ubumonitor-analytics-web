import { loginWithCredentials, loginWithSso, logoutSession } from "@/backend/services/auth"
import { getCheckServiceHealthUrl } from "@/backend/services/health"
import BackendErrorDialog from "@/components/dialogs/BackendErrorDialog.svelte"
import { AppError } from "@/error/errors"
import { coursesStore } from "@/stores/courses.svelte"
import { dialogStore } from "@/stores/dialog.svelte"
import { loginStore } from "@/stores/login.svelte"
import { invoke } from "@tauri-apps/api/core"
import ky from "ky"

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
  let result

  try {
    result = await invoke<SiteInfo>("get_public_moodle_config", { host })
  } catch {
    throw new AppError("MOODLE_INVALID")
  }

  if (!result.enableMobileWebService || !result.enableWebServices) {
    throw new AppError("MOODLE_UNSOPPORTED")
  }

  if (result.maintenanceEnabled) {
    throw new AppError(result.maintenanceMessage ?? "MOODLE_MAINTENANCE")
  }

  return result
}

export async function appLogin(
  username: string,
  password: string,
  dbPassword: string,
  host: string,
) {
  await health

  const loginResponse = await loginWithCredentials({
    username,
    password,
    dbPassword,
    host,
  })

  loginStore.token = loginResponse.accessToken
}

interface Cookie {
  name: string
  value: string
}

interface Web {
  url: string
  cookies: Cookie[]
}

export async function webLogin(host: string, dbPassword: string, launchUrl: string) {
  const { url, cookies } = await invoke<Web>("open_moodle_login", { loginUrl: launchUrl })

  await health

  const response = await loginWithSso({
    host,
    moodleLaunchCredential: url,
    dbPassword,
    cookies: cookies,
  })

  loginStore.token = response.accessToken
}

export async function logout() {
  loginStore.clear()
  coursesStore.clear()
  await logoutSession()
}

const health = ky
  .get(getCheckServiceHealthUrl(), {
    retry: {
      limit: 50,
      delay: () => 200,
    },
  })
  .catch(() => dialogStore.openDialog(BackendErrorDialog))
