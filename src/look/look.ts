import { Status, Theme } from '../type'

export interface LookManagerProps {
  document: Document
  favicon: HTMLLinkElement
  faviconConnected: HTMLLinkElement
  faviconDisconnected: HTMLLinkElement
  theme: Theme
}

export interface LookManagerState {
  status: Status
  titleConnected: string
  titleDisconnected: string
}

export function createLookManager(props: LookManagerProps, stateParam: LookManagerState) {
  const { document, favicon, faviconConnected, faviconDisconnected, theme } = props

  const state: LookManagerState = { ...stateParam }

  return {
    update(props: Partial<LookManagerState>) {
      if (props.titleConnected) {
        state.titleConnected = props.titleConnected
      }

      if (props.titleDisconnected) {
        state.titleDisconnected = props.titleDisconnected
      }

      if (props.status && props.status !== state.status) {
        state.status = props.status
        if (state.status === 'connected') {
          favicon.href = faviconConnected.href
          document.title = state.titleConnected
          document.documentElement.style.backgroundColor = theme.connected
          document.body.style.backgroundColor = theme.connected
        } else if (state.status === 'disconnected') {
          favicon.href = faviconDisconnected.href
          document.title = state.titleDisconnected
          document.documentElement.style.backgroundColor = theme.disconnected
          document.body.style.backgroundColor = theme.disconnected
        }
      }
    },
  }
}
