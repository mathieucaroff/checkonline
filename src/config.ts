import { ensureSpacelessURL, resolveSearchAndHash } from './lib/urlParameter'
import { parseTimeToMs } from './util/parseTimeToMs'
import { day } from './util/time'

export let parseConfig = (configStorage: ConfigStorage, location: Location) => {
  ensureSpacelessURL(location)

  let config = resolveSearchAndHash<CheckOnlineConfig>(location, {
    // programmer
    fail: () => false,
    debug: () => false,
    // canvas
    clear: () => false,
    // connection and clock
    period: () => configStorage.getItem('period') ?? '500ms',
    reactivity: () => configStorage.getItem('reactivity') ?? '500ms',
    punctualityThreshold: () => '4s',
    targetList: () => 'https://www.bing.com/s/a/bing_p.ico==https://www.google.com/favicon.ico',
    timezoneOffset: () => `${new Date().getTimezoneOffset()}m`,
    // page
    title: () => 'Checkonline',
    connectedTitle: ({ title }) =>
      configStorage.getItem('connectedTitle') || title() || 'CONNECTED',
    disconnectedTitle: ({ title }) =>
      configStorage.getItem('disconnectedTitle') || title() || 'DISCONNECTED',
    // rightside canvas
    right: ({ timezoneOffset }) =>
      day(new Date(Date.now() - parseTimeToMs(timezoneOffset()) - 86400 * 1000)),
  })

  for (const key of ['period', 'reactivity', 'punctualityThreshold', 'timezoneOffset'] as const) {
    try {
      parseTimeToMs(config[key], { timer: key !== 'timezoneOffset' })
    } catch (error) {
      throw new RangeError(
        `Invalid configuration "${key}": ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return config
}
