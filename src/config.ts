import { OnlineConfig } from './type/onlineConfig'
import { parseTimeToMs } from './util/parseTimeToMs'
import { getUrlParam, spacelessUrl, urlRemoveParam } from './util/urlParam'

export let getConfig = (location: Location) => {
   spacelessUrl(location)

   let config = getUrlParam<OnlineConfig>(location, {
      // programmer
      debug: () => false,
      // canvas action
      clear: () => false,
      height: () => 720,
      width: () => 1920,
      // clock
      fast: () => false,
      period: ({ fast }) => {
         if (fast()) {
            return '125ms'
         } else {
            return '1000ms'
         }
      },
      // connection
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

   return config
}
