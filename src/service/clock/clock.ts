/**
 * createClock
 *
 * @param period - time between two ticks in ms
 * @param offset - offset applies to the time passed to the callback function,
 *                 in ms
 * @param punctualityThreshold
 *        if the clock is late and the clock delay is above the punctuality
 *        threshold, the clock will set `skip` to true in the callbacks it
 *        performs until the delay is below the threshold.
 * @param callback - function called every `period` of time. It receives the
 *                   exact time at which it was scheduled to be called,
 *                   eventhough the call it receives may happen later than that
 *                   time. It also receives the duration until the next call.
 *                   Usually this duration is just the period, but it is smaller
 *                   than the period when the `start` or `setPeriod` method is
 *                   called.
 * @returns a clock object containing the `setPeriod` and `stop` methods.
 */
export let createClock = (
  period: number,
  offset: number,
  punctualityThreshold: number,
  callback: (time: number, duration: number, skip: boolean) => void,
) => {
  const now = () => Date.now() - offset
  let timeoutId: NodeJS.Timeout
  let targetTime: number

  const tick = () => {
    try {
      const skip = Date.now() - targetTime > punctualityThreshold
      callback(targetTime, period, skip)
    } finally {
      targetTime += period
      timeoutId = setTimeout(tick, targetTime - now())
    }
  }

  const me = {
    /**
     * Stop the clock
     */
    stop: () => {
      clearTimeout(timeoutId)
    },
    /**
     * Start the clock
     */
    start: () => {
      let time = now()

      targetTime = period * (Math.floor(time / period) + 1)
      try {
        callback(time, targetTime - time, false)
      } finally {
        timeoutId = setTimeout(tick, targetTime - time)
      }
    },
    /**
     * Reconfigure the clock period
     */
    setPeriod: (newPeriod: number) => {
      me.stop()
      period = newPeriod
      me.start()
    },
    setPunctualityThreshold: (newPunctualityThreshold: number) => {
      punctualityThreshold = newPunctualityThreshold
    },
  }

  me.start()

  return me
}

export type Clock = ReturnType<typeof createClock>
