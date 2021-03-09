import { OnlineConfig } from './type/onlineConfig'
import { parseTimeToMs } from './util/parseTimeToMs'
import { getUrlParam, spacelessUrl, urlRemoveParam } from './util/urlParam'

export let getConfig = (location: Location) => {
   spacelessUrl(location)

   let config = getUrlParam<OnlineConfig>(location, {
      // programmer
      debug: () => false,
      // canvas
      clear: () => false,
      height: () => 720,
      width: () => 1920,
      // clock
      fast: () => false,
      period: ({ fast }) => {
         if (fast()) {
            return '125ms'
         } else {
            return '500ms'
         }
      },
      // connection
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
      connectedColor: () => '#000',
      connectedTitle: () => 'Online',
      disconnectedColor: () => '#FFF',
      disconnectedTitle: () => 'DISCONNECTED',
   })

   console.info('config', config)

   if (config.fast) {
      urlRemoveParam(location, 'speed')
      urlRemoveParam(location, 'fill')
   }

   return config
}
