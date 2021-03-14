import { parseTheme } from './theme/theme'
import { OnlineConfig } from './type/onlineConfig'
import { parseTimeToMs } from './util/parseTimeToMs'
import { getUrlParam, spacelessUrl, urlRemoveParam } from './util/urlParam'

export let parseConfig = (location: Location) => {
   spacelessUrl(location)

   let config = getUrlParam<OnlineConfig>(location, {
      // programmer
      debug: () => false,
      // canvas
      clear: () => false,
      // clock
      fast: () => false,
      period: ({ fast }) => {
         if (fast()) {
            return '125ms'
         } else {
            return '500ms'
         }
      },
      periodNumber: ({ period }) => {
         return parseTimeToMs(period())
      },
      pixelPeriod: ({ periodNumber }) => {
         return (8 * periodNumber()) / 1000
      },
      timezone: () => new Date().getTimezoneOffset(),
      timeoffset: () => 0,
      compoundOffset: ({ timezone, timeoffset }) => timeoffset() - timezone() * 60,
      // connection
      fail: () => false,
      timeout: () => 500,
      targetCount: () => 2,
      targetList: ({ targetCount }) => {
         let targetArray = [
            'https://www.bing.com/s/a/bing_p.ico',
            'https://www.google.com/favicon.ico',
         ]
         return targetArray.slice(0, targetCount()).join('==')
      },
      // page
      title: () => false,
      connectedTitle: ({ title }) => (title() ? 'CONNECTED' : 'Online'),
      disconnectedTitle: ({ title }) => (title() ? 'DISCONNECTED' : 'Online'),
      // theme
      theme: () => 'semantic',
      color: () => '',
      themeObject: ({ theme, color }) => parseTheme({ theme: theme(), color: color() }),
   })

   console.info('config', config)

   if (config.fast) {
      urlRemoveParam(location, 'speed')
      urlRemoveParam(location, 'fill')
   }

   return config
}
