class LoginStore {
  token = $state<string | null>(null)

  reset() {
    this.token = null
  }
}

export const loginStore = new LoginStore()
