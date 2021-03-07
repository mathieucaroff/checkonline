/**
 * Test whether internet is available by loading an image
 */

import { loadImage } from '../util/loadImage'

export let pingTest = (imageUrlList: string[], timeout = 10 * 1000) => {
   let startTime = new Date().getTime()

   return new Promise((resolve, reject) => {
      let handle = () => {
         clearTimeout(errorTimeoutId)
         resolve(new Date().getTime() - startTime)
      }

      imageUrlList.forEach((imageUrl) => {
         loadImage(imageUrl + '?t=' + (startTime % (86400 * 100))).then(handle)
      })

      let errorTimeoutId = setTimeout(() => {
         reject('timeout')
      }, timeout)
   })
}
