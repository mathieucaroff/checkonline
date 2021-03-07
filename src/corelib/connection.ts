/**
 * Test whether internet is available by loading an image
 */

import { time } from 'console'
import { loadImage } from '../util/loadImage'

export let pingTest = (imageUrlList: string[], timeout = 10 * 1000) => {
   let startTime = new Date().getTime()

   return new Promise((resolve, reject) => {
      let handle = () => {
         clearTimeout(errorTimeoutId)
         resolve(new Date().getTime() - startTime)
      }

      imageUrlList.forEach((imageUrl) => {
         loadImage(imageUrl + '?time=' + startTime).then(handle)
      })

      let errorTimeoutId = setTimeout(() => {
         reject('timeout')
      }, timeout)
   })
}
