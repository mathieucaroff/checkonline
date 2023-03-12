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
