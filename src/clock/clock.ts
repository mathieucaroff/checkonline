/**
 * createClock
 *
 * @param period - time between two ticks in ms
 * @param offset - offset applied to the time passed to the callback function,
 *                 in ms
 * @param callback - function called every `period` of time. It receives the
 *                   exact time at which it was scheduled to be called,
 *                   eventhough the call it receives may happen later than that
 *                   time. The `oudated` boolean is true whenever the clock has
 *                   run late and is speeding to catch up the time.
 * @returns a clock object containing the clock disposal function
 */
export let createClock = (
  period: number,
  offset: number,
  punctualityThreshold: number,
  callback: (t: number, lastT?: number, outdated?: boolean) => void,
) => {
  let timeoutId: NodeJS.Timeout
  let initialTime = Date.now()
  let lastTime: number | undefined

  let tick = (counter: number) => {
    let now = Date.now()
    let targetTime = initialTime + counter * period
    let delta = targetTime - now

    timeoutId = setTimeout(() => tick(counter + 1), delta)
    callback(targetTime - offset, lastTime, delta <= -punctualityThreshold)
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
