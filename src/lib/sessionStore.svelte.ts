import { authLogout } from "@/services/auth/auth"

let tokenState = $state(sessionStorage.getItem("token"))
let userIdState = $state(Number(sessionStorage.getItem("userId")))
let currentCourseIdState = $state(Number(sessionStorage.getItem("currentCourseId")))

export function getToken(): string | null {
  return tokenState
}

export function setToken(token: string) {
  sessionStorage.setItem("token", token)
  tokenState = token
}

export function getUserId(): number {
  return userIdState
}

export function setUserId(userId: number) {
  sessionStorage.setItem("userId", userId.toString())
  userIdState = userId
}

export function getCurrentCourseId(): number {
  return currentCourseIdState
}

export function setCurrentCourseId(currentCourseId: number) {
  sessionStorage.setItem("currentCourseId", currentCourseId.toString())
  currentCourseIdState = currentCourseId
}

export function clearSession() {
  authLogout()

  sessionStorage.removeItem("token")
  sessionStorage.removeItem("userId")
  sessionStorage.removeItem("currentCourseId")
  tokenState = null
  userIdState = 0
  currentCourseIdState = NaN
}
