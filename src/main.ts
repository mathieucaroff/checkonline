import { Clock, createClock } from './clock/clock'
import { parseConfig } from './config'
import { pingTest } from './connection/connection'
import { createDisplay } from './display/display'
import { urlRemoveSearchAndHashParam } from './lib/urlParameter'
import { createPage } from './page/page'
import { CheckOnlineConfig } from './type'
import { day, dayOf } from './util/day'
import { createImageStorage } from './util/imageStorage'
import { loadImage } from './util/loadImage'
import { parseTimeToMs } from './util/parseTimeToMs'

function main() {
  const page = createPage()
  document.body.appendChild(page.content)
  const config = parseConfig(location)
  const displayLeft = createDisplay({ document, canvas: page.canvasLeft, config })
  const displayRight = createDisplay({ document, canvas: page.canvasRight, config })
  let imageStorage = createImageStorage()
  let clock: Clock = { dispose: () => {} }

  const now = () => {
    return new Date(Date.now() - parseTimeToMs(config.timezoneOffset))
  }

  /**
   * ping
   * @param time - time to use to write the ping result to the canvas
   */
  const ping = (time: number, lastTime?: number) => {
    if (lastTime && dayOf(lastTime) !== dayOf(time)) {
      handleEndOfDay(new Date(lastTime))
    }
    lastTime = time
    const closer = displayLeft.open(time)
    pingTest(config, location)
      .then(() => {
        closer.closeSuccess()
      })
      .catch(() => {
        closer.closeError()
      })
  }

  const handleEndOfDay = (currentDay: Date) => {
    imageStorage.saveImage(page.canvasLeft, currentDay)
    console.log(`handleEndOfDay (${day(currentDay)})`)
    displayLeft.wipe()
    displayLeft.drawTimeIndicator()
    updateConfig()
  }

  const updateConfig = () => {
    let lastConfig = { ...config }
    Object.entries(parseConfig(location)).forEach(([k, v]) => ((config as any)[k] = v))
    applyConfig(config, lastConfig)
  }

  const applyConfig = (config: CheckOnlineConfig, lastConfig: CheckOnlineConfig) => {
    console.info('config', config)

    if (config.clear) {
      imageStorage.removeImage(now())
      displayLeft.wipe()
      displayLeft.drawTimeIndicator()
      urlRemoveSearchAndHashParam(location, 'clear')
    }

    if (
      config.period !== lastConfig.period ||
      config.timezoneOffset !== lastConfig.timezoneOffset
    ) {
      // (Re)-Start ticking
      clock.dispose()
      clock = createClock(parseTimeToMs(config.period), parseTimeToMs(config.timezoneOffset), ping)
    }

    let rightImageDataUrl = imageStorage.loadImageFromDay(config.right)
    if (rightImageDataUrl) {
      loadImage(rightImageDataUrl).then(displayRight.restore)
    } else {
      displayRight.wipe()
      displayRight.drawTimeIndicator()
    }
  }

  applyConfig(config, {} as any)

  window.addEventListener('hashchange', updateConfig)

  // Backing up and restoring the canvas image
  window.addEventListener('beforeunload', () => {
    imageStorage.saveImage(page.canvasLeft, now())
  })
  let imageDataUrl = imageStorage.loadImage(now())
  if (imageDataUrl) {
    loadImage(imageDataUrl).then(displayLeft.restore)
  } else {
    displayLeft.wipe() // make the canvas non-transparent and grey
  }
}

main()
