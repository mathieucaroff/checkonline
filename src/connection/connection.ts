/**
 * Test whether internet is available by loading an image
 */
import { urlRemoveSearchAndHashParam } from '../lib/urlParameter'
import { CheckOnlineConfig } from '../type'
import { loadImage } from '../util/loadImage'
import { parseTimeToMs } from '../util/parseTimeToMs'

export let pingTest = (config: CheckOnlineConfig, location: Location) => {
  let imageUrlList = config.targetList.split('==')
  let startTime = new Date().getTime()

  return new Promise<number>((resolve, reject) => {
    let timeout = parseTimeToMs(config.reactivity)

    if (config.fail) {
      urlRemoveSearchAndHashParam(location, 'fail')
      setTimeout(() => {
        reject('fake timeout')
      }, timeout)
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
    }, timeout)
  })
}
