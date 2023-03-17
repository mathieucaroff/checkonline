import { KeyStorage } from './storage/storage'

export interface Pair {
  x: number
  y: number
}

export interface CheckOnlineConfig {
  // debugging options, for programmers
  fail: boolean
  debug: boolean

  // canvas
  clear: boolean

  // connectivity (duration with their unit)
  /**
   * Duration between the emission of two requests towards the target(s)
   */
  period: string
  /**
   * Duration past which a request against the target(s) is considered to have failed
   */
  reactivity: string
  /**
   * If the clock runs late past the punctualityThreshold, it'll include the
   * "outdated" flag in its calls to the callback function
   */
  punctualityThreshold: string
  // connection
  /**
   * List of image to load to check the connection status.
   * This list is split on double equal sign `==`.
   * The connection status is considered online as soon as any target responds.
   * If no target responds before the `reactivity` time is elapsed, then the
   * status is a failure.
   */
  targetList: string
  /**
   * The timezone offset to Greenwitch time
   */
  timezoneOffset: string

  // page
  title: string
  connectedTitle: string
  disconnectedTitle: string

  // rightside canvas
  /**
   * Date of the day whose recording shall be displayed on the right side or at
   * the bottom of the page
   */
  right: string
}

export interface ActionObject {
  clear: () => void
  setPeriod: (period: string) => void
  setReactivity: (reactivity: string) => void
}

export type Status = 'unknown' | 'connected' | 'disconnected'

export interface State {
  status: Status
}

export interface SavedConfig {
  period: string
  reactivity: string
  enableCustomTitle: boolean
  connectedTitle: string
  disconnectedTitle: string
  clear: string
  fail: string
}

export type ConfigStorage = KeyStorage<SavedConfig>
