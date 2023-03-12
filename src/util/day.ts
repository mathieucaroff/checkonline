/**
 * day
 *
 * @param {Date} time - The time whose day is wanted
 * @returns A string of the day in ISO format
 */
export let day = (time: Date) => {
  return time.toISOString().split('T')[0]
}

/**
 * dayOf
 *
 * @param time - the time in epoch ms
 * @returns the time in epoch days
 */
export let dayOf = (time: number) => {
  return Math.floor(time / (24 * 3600 * 1000))
}
