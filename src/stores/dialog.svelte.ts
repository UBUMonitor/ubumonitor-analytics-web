import type { Component, ComponentProps } from "svelte"

class DialogStore {
  component = $state<Component | null>(null)
  props = $state.raw<ComponentProps<Component>>()
  dialogRef = $state.raw<HTMLDialogElement>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog<C extends Component<any>>(component: C, props?: ComponentProps<C>) {
    this.component = component
    this.props = props
    this.dialogRef?.showModal()
  }

  closeDialog() {
    this.dialogRef?.close()
  }
}

export const dialogStore = new DialogStore()
