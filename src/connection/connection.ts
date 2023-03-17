/**
 * Test whether internet is available by loading an image
 */
import { urlRemoveSearchAndHashParamAndLocalStorage } from '../lib/urlParameter'
import { KeyStorage } from '../storage/storage'
import { CheckOnlineConfig } from '../type'
import { loadImage } from '../util/loadImage'
import { parseTimeToMs } from '../util/parseTimeToMs'

export let pingTest = (config: CheckOnlineConfig, location: Location, keyStorage: KeyStorage) => {
  let imageUrlList = config.targetList.split('==')
  let startTime = new Date().getTime()

  return new Promise<number>((resolve, reject) => {
    let timeout = parseTimeToMs(config.reactivity)

    if (config.fail) {
      urlRemoveSearchAndHashParamAndLocalStorage(location, keyStorage, 'fail')
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
