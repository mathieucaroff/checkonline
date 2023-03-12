import { ensureSpacelessURL, resolveSearchAndHash } from './lib/urlParameter'
import { CheckOnlineConfig } from './type'
import { day } from './util/day'
import { parseTimeToMs } from './util/parseTimeToMs'

export let parseConfig = (location: Location) => {
  ensureSpacelessURL(location)

  let config = resolveSearchAndHash<CheckOnlineConfig>(location, {
    // programmer
    fail: () => false,
    debug: () => false,
    // canvas
    clear: () => false,
    // connection and clock
    period: () => '500ms',
    reactivity: () => '500ms',
    targetList: () => 'https://www.bing.com/s/a/bing_p.ico==https://www.google.com/favicon.ico',
    timezoneOffset: () => `${new Date().getTimezoneOffset()}m`,
    // page
    title: () => 'Check online',
    connectedTitle: ({ title }) => title() || 'CONNECTED',
    disconnectedTitle: ({ title }) => title() || 'DISCONNECTED',
    // rightside canvas
    right: ({ timezoneOffset }) =>
      day(new Date(Date.now() - parseTimeToMs(timezoneOffset()) - 86400 * 1000)),
  })

  return config
}
