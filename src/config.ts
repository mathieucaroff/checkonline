import { OnlineConfig } from './type/onlineConfig'
import { parseTimeToMs } from './util/parseTimeToMs'
import { getUrlParam, spacelessUrl, urlRemoveParam } from './util/urlParam'

export let getConfig = (location: Location) => {
   spacelessUrl(location)

   let config = getUrlParam<OnlineConfig>(location, {
      clear: () => false,
      debug: () => false,
      fast: () => false,
      height: () => 720,
      width: () => 1920,
      drawSpeed: ({ period }) => {
         let p = parseTimeToMs(period())
         return (8 * p) / 1000
      },
      period: ({ fast }) => {
         if (fast()) {
            return '125ms'
         } else {
            return '1000ms'
         }
      },
      targetCount: () => 2,
      targetList: ({ targetCount }) => {
         let targetArray = [
            'https://www.bing.com/s/a/bing_p.ico',
            'http://www.google.com/favicon.ico',
         ]
         return targetArray.slice(0, targetCount()).join('==')
      },
   })

   console.info('config', config)

   if (config.fast) {
      urlRemoveParam(location, 'speed')
      urlRemoveParam(location, 'fill')
   }
   if (config.fill) {
      urlRemoveParam(location, 'speed')
      urlRemoveParam(location, 'fast')
   }

   return config
}
