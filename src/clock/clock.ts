/**
 * createClock
 *
 * @param period - time between two ticks in ms
 * @param offset - offset applied to the time passed to the callback function,
 *                 in ms
 * @param callback - function called every `period` of time. It receives the
 *                   exact time at which it was scheduled to be called,
 *                   eventhough the call it receives may happen later than that
 *                   time.
 * @returns a clock object containing the clock disposal function
 */
export let createClock = (
  period: number,
  offset: number,
  callback: (t: number, lastT?: number) => void,
) => {
  let timeoutId: NodeJS.Timeout
  let initialTime = Date.now()
  let lastTime: number | undefined

  let tick = (counter: number) => {
    let now = Date.now()
    let targetTime = initialTime + counter * period
    let delta = targetTime - now
    let increment = Math.max(1, delta / period)
    timeoutId = setTimeout(() => tick(counter + increment), delta)

    callback(targetTime - offset, lastTime)
    lastTime = targetTime - offset
  }

  timeoutId = setTimeout(() => tick(0), 0)

  return {
    /**
     * The function to dispose of the clock
     */
    dispose: () => {
      clearTimeout(timeoutId)
    },
  }
}

export type Clock = ReturnType<typeof createClock>
