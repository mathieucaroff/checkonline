/**
 * Test whether internet is available by loading an image
 */
import { TARGET_LIST } from '../constant'
import { urlRemoveSearchAndHashParamAndLocalStorage } from '../lib/urlParameter'
import { CheckOnlineConfig, ConfigStorage } from '../type'
import { loadImage } from '../util/loadImage'
import { parseTimeToMs } from '../util/parseTimeToMs'

export let pingTest = (
  config: CheckOnlineConfig,
  configStorage: ConfigStorage,
  location: Location,
) => {
  let startTime = new Date().getTime()

  return new Promise<number>((resolve, reject) => {
    let timeout = parseTimeToMs(config.reactivity)

    if (config.fail) {
      urlRemoveSearchAndHashParamAndLocalStorage(location, configStorage, 'fail')
      setTimeout(() => {
        reject('fake timeout')
      }, timeout)
      return
    }

    let handle = () => {
      clearTimeout(errorTimeoutId)
      resolve(new Date().getTime() - startTime)
    }

    TARGET_LIST.forEach((imageUrl) => {
      loadImage(imageUrl + '?t=' + (startTime % (86400 * 100))).then(handle)
    })

    let errorTimeoutId = setTimeout(() => {
      reject('timeout')
    }, timeout)
  })
}
