let username = $state(localStorage.getItem("username"))
let host = $state(localStorage.getItem("host"))

export function getUsername() {
  return username
}

export function setUsername(newUsername: string) {
  username = newUsername
  localStorage.setItem("username", newUsername)
}

export function clearUsername() {
  username = null
  localStorage.removeItem("username")
}

export function getHost() {
  return host
}

export function setHost(newHost: string) {
  host = newHost
  localStorage.setItem("host", newHost)
}

export function clearHost() {
  host = null
  localStorage.removeItem("host")
}
