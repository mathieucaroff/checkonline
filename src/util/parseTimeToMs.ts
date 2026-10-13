export let parseTimeToMs = (timeDescription: string, options: { timer?: boolean } = {}) => {
  if (typeof timeDescription !== 'string') {
    throw new TypeError('Duration must be a string')
  }

  let match = timeDescription.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(ms|s|m|h|d)?$/i)
  if (!match) {
    throw new RangeError(`Invalid duration: "${timeDescription}"`)
  }

  let unit = (match[2] ?? 'ms').toLowerCase() as 'ms' | 's' | 'm' | 'h' | 'd'
  let milliseconds =
    Number(match[1]) *
    {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 3600 * 1000,
      d: 86400 * 1000,
    }[unit]

  if (!Number.isFinite(milliseconds)) {
    throw new RangeError(`Duration must be a valid finite float: "${timeDescription}"`)
  }
  if (options.timer && (milliseconds < 1 || milliseconds > 2_147_483_647)) {
    throw new RangeError(`Timer duration must be between 1 and 2147483647ms: "${timeDescription}"`)
  }

  return milliseconds
}
