import { default as packageInfo } from '../package.json'
import { Clock, createClock } from './clock/clock'
import { parseConfig } from './config'
import { pingTest } from './connection/connection'
import { createDisplay } from './display/display'
import { urlRemoveSearchAndHashParamAndLocalStorage } from './lib/urlParameter'
import { createPage } from './page/page'
import { createImageStorage } from './storage/imageStorage'
import { createKeyStorage } from './storage/storage'
import { THEME } from './theme'
import { ActionObject, CheckOnlineConfig, SavedConfig, State } from './type'
import { day, dayOf } from './util/day'
import { loadImage } from './util/loadImage'
import { parseTimeToMs } from './util/parseTimeToMs'

function main() {
  const oneDay = 86_400_000

  const configStorage = createKeyStorage<SavedConfig>(localStorage, packageInfo.name)

  const action: ActionObject = {
    clear() {
      imageStorage.removeImage(now())
      displayLeft.wipe()
      displayLeft.drawTimeIndicator()
    },
    setPeriod(period) {
      updateConfig({ ...config, period })
    },
    setReactivity(reactivity) {
      updateConfig({ ...config, reactivity })
    },
  }

  const state: State = { status: 'unknown' }

  const config = parseConfig(configStorage, location)
  const page = createPage(config, state, configStorage, action)
  document.body.appendChild(page.content)
  const displayLeft = createDisplay({
    canvas: page.canvasLeft,
    dayName: day(new Date()),
  })
  const displayRight = createDisplay({
    canvas: page.canvasRight,
    dayName: day(new Date(Date.now() - oneDay)),
  })
  let imageStorage = createImageStorage()
  let clock: Clock = { dispose: () => {} }

  const now = () => {
    return new Date(Date.now() - parseTimeToMs(config.timezoneOffset))
  }

  let favicon = document.getElementById('favicon') as HTMLLinkElement
  let faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
  let faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

  /**
   * ping
   * @param time - time to use to write the ping result to the canvas
   */
  const ping = (time: number, lastTime: number | undefined, skip: number) => {
    if (lastTime && dayOf(lastTime) !== dayOf(time)) {
      handleEndOfDay(new Date(lastTime))
    }
    lastTime = time
    if (skip > 0) {
      displayLeft.open(time, `${skip}ms`).closeCancel()
      return
    }
    const closer = displayLeft.open(time, config.period)
    pingTest(config, location, configStorage)
      .then(() => {
        closer.closeSuccess()

        if (state.status !== 'connected') {
          state.status = 'connected'
          favicon.href = faviconConnected.href
          document.title = config.connectedTitle
          document.documentElement.style.backgroundColor = THEME.connected
          document.body.style.backgroundColor = THEME.connected
        }
      })
      .catch(() => {
        closer.closeError()

        if (state.status !== 'disconnected') {
          state.status = 'disconnected'
          favicon.href = faviconDisconnected.href
          document.title = config.disconnectedTitle
          document.documentElement.style.backgroundColor = THEME.disconnected
          document.body.style.backgroundColor = THEME.disconnected
        }
      })
  }

  const handleEndOfDay = (currentDay: Date) => {
    imageStorage.saveImage(page.canvasLeft, currentDay)
    console.log(`handleEndOfDay (${day(currentDay)})`)
    displayLeft.wipe()
    displayLeft.setDayName(day(new Date()))
    displayLeft.drawTimeIndicator()
    updateConfig(parseConfig(configStorage, location))
  }

  const updateConfig = (newConfig: CheckOnlineConfig) => {
    let lastConfig = { ...config }
    Object.entries(newConfig).forEach(([k, v]) => ((config as any)[k] = v))
    applyConfig(config, lastConfig)
  }

  const applyConfig = (config: CheckOnlineConfig, lastConfig: CheckOnlineConfig) => {
    console.info('config', config)

    if (config.clear) {
      action.clear()
      urlRemoveSearchAndHashParamAndLocalStorage(location, configStorage, 'clear')
    }

    if (
      config.period !== lastConfig.period ||
      config.timezoneOffset !== lastConfig.timezoneOffset
    ) {
      // (Re)-Start ticking
      clock.dispose()
      clock = createClock(
        parseTimeToMs(config.period),
        parseTimeToMs(config.timezoneOffset),
        parseTimeToMs(config.punctualityThreshold),
        ping,
      )
    }

    let rightImageDataUrl = imageStorage.loadImageFromDay(config.right)
    if (rightImageDataUrl) {
      displayRight.setDayName(config.right)
      loadImage(rightImageDataUrl).then(displayRight.restore)
    } else {
      displayRight.wipe()
      displayRight.setDayName(day(new Date(Date.now() - oneDay)))
      displayRight.drawTimeIndicator()
    }
  }

  applyConfig(config, {} as any)

  window.addEventListener('hashchange', () => updateConfig(parseConfig(configStorage, location)))

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
