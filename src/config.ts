import { OnlineConfig } from './type/onlineConfig'
import { getUrlParam, spacelessUrl, urlRemoveParam } from './util/urlParam'

export let getConfig = (location: Location) => {
   spacelessUrl(location)

   let config = getUrlParam<OnlineConfig>(location, {
      clear: () => false,
      debug: () => false,
      fast: () => false,
      fill: () => false,
      headSquareSize: () => 6,
      period: () => '1s',
      height: () => 720,
      width: () => 1920,
      speed: ({ fast, fill }) => {
         if (fast()) {
            return 8 * 4
         }
         if (fill()) {
            return 3840
         }
         return 1
      },
      drawSpeed: ({ fast, speed }) => {
         if (fast()) {
            return 8
         }
         let ds = speed()
         while (ds > 480) ds /= 2
         return ds
      },
      tickSpeed: ({ speed, drawSpeed }) => {
         if (speed() > drawSpeed()) {
            return speed() / drawSpeed()
         } else {
            return 1
         }
      },
      targetList: () =>
         'http://www.google.com/images/google_favicon_128.png==http://www.bing.com/s/a/bing_p.ico',
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
