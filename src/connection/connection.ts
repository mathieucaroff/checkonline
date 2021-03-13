/**
 * Test whether internet is available by loading an image
 */

import { OnlineConfig } from '../type/onlineConfig'
import { loadImage } from '../util/loadImage'
import { urlRemoveParam } from '../util/urlParam'

export let pingTest = (config: OnlineConfig, location: Location) => {
   let imageUrlList = config.targetList.split('==')
   let startTime = new Date().getTime()

   return new Promise<number>((resolve, reject) => {
      if (config.fail) {
         urlRemoveParam(location, 'fail')
         setTimeout(() => {
            reject('fake timeout')
         }, config.timeout)
         return
      }

      let handle = () => {
         clearTimeout(errorTimeoutId)
         resolve(new Date().getTime() - startTime)
      }

      imageUrlList.forEach((imageUrl) => {
         loadImage(imageUrl + '?t=' + (startTime % (86400 * 100))).then(handle)
      })

      let errorTimeoutId = setTimeout(() => {
         reject('timeout')
      }, config.timeout)
   })
}
