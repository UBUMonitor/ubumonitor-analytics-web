import type { Component, ComponentProps } from "svelte"

// Svelte's component type requires an erased props type for dynamic rendering.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynamicComponent = Component<any>

class DialogState {
  component = $state.raw<DynamicComponent | null>(null)
  props = $state.raw<ComponentProps<DynamicComponent> | undefined>(undefined)
  dialogRef = $state.raw<HTMLDialogElement | null>(null)

  open<C extends DynamicComponent>(component: C, props?: ComponentProps<C>) {
    this.component = component
    this.props = props
    this.dialogRef?.showModal()
  }

  close() {
    this.dialogRef?.close()
    this.reset()
  }

  reset() {
    this.component = null
    this.props = undefined
  }
}

export const dialog = new DialogState()

export function openDialog<C extends DynamicComponent>(component: C, props?: ComponentProps<C>) {
  dialog.open(component, props)
}

export function closeDialog() {
  dialog.close()
}
