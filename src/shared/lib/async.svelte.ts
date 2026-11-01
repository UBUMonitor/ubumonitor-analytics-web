import { notifyError } from "@/shared/lib/notify"

export class AsyncAction {
  loading = $state(false)

  async run(action: () => Promise<unknown>): Promise<boolean> {
    this.loading = true

    try {
      await action()
      return true
    } catch (error) {
      notifyError(error)
      return false
    } finally {
      this.loading = false
    }
  }
}
