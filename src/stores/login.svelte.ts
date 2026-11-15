class LoginStore {
  token = $state<string | null>(null)

  clear() {
    this.token = null
  }
}

export const loginStore = new LoginStore()
