import { default as packageInfo } from '../package.json'
import { parseConfig } from './config'
import { BROADCAST_CHANNEL_NAME } from './constant'
import { Display, createDisplay } from './display/display'
import { urlRemoveSearchAndHashParamAndLocalStorage } from './lib/urlParameter'
import { createLookManager } from './look/look'
import { createPage } from './page/page'
import { createImageStorage } from './storage/imageStorage'
import { createKeyStorage } from './storage/storage'
import { THEME } from './theme'
import { ActionObject, Message, SavedConfig, State } from './type'
import { createBroadcastChannel } from './util/channel'
import { loadImage } from './util/loadImage'
import { parseTimeToMs } from './util/parseTimeToMs'
import { day, dayOf } from './util/time'

function main() {
  new Worker(new URL('./worker/dedicatedWorker', import.meta.url), { type: 'module' })

  const oneDay = 86_400_000

  const configStorage = createKeyStorage<SavedConfig>(localStorage, packageInfo.name)

  const checkonlineChannel = createBroadcastChannel<Message>(BROADCAST_CHANNEL_NAME)

  const action: ActionObject = {
    clear() {
      imageStorage.removeImage(now())
      displayLeft.wipe()
      displayLeft.drawWireframe()
    },
    setPeriod(period) {
      checkonlineChannel.postMessage({ type: 'config', period: parseTimeToMs(period) })
    },
    setReactivity(reactivity) {
      checkonlineChannel.postMessage({ type: 'config', reactivity: parseTimeToMs(reactivity) })
    },
    setArchiveDisplayDate(date) {
      displayRight.setDayName(date)
      let rightImageDataUrl = imageStorage.loadImageFromDay(date)
      if (rightImageDataUrl) {
        loadImage(rightImageDataUrl).then(displayRight.restore)
      } else {
        displayRight.wipe()
        displayRight.drawWireframe()
      }
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

  const now = () => {
    return new Date(Date.now() - parseTimeToMs(config.timezoneOffset))
  }

  if (config.clear) {
    action.clear()
    urlRemoveSearchAndHashParamAndLocalStorage(location, configStorage, 'clear')
  }

  action.setArchiveDisplayDate(config.right)
  const handleEndOfDay = (currentDay: Date) => {
    imageStorage.saveImage(page.canvasLeft, currentDay)
    action.setArchiveDisplayDate(day(currentDay))
    displayLeft.wipe()
    displayLeft.setDayName(day(new Date()))
    displayLeft.drawWireframe()
  }

  const favicon = document.getElementById('favicon') as HTMLLinkElement
  const faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
  const faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

  const lookManager = createLookManager(
    {
      document,
      favicon,
      faviconConnected,
      faviconDisconnected,
      theme: THEME,
    },
    {
      status: 'unknown',
      titleConnected: document.title,
      titleDisconnected: document.title,
    },
  )

  let outcomeSignalSet: Record<any, ReturnType<Display['open']>> = {}
  let lastDay = 0
  checkonlineChannel.addMessageEventListener(({ data }) => {
    let today = dayOf(Date.now() - parseTimeToMs(config.timezoneOffset))
    if (lastDay && today > lastDay) {
      handleEndOfDay(new Date(lastDay * 24 * 3600 * 1000))
    }
    lastDay = today

    if (data.type === 'open') {
      outcomeSignalSet[data.time] = displayLeft.open(data.time, `${data.duration}ms`)
    } else if (data.type === 'success') {
      lookManager.update({ status: 'connected' })
      outcomeSignalSet[data.time]?.closeSuccess()
      delete outcomeSignalSet[data.time]
    } else if (data.type === 'failure') {
      lookManager.update({ status: 'disconnected' })
      outcomeSignalSet[data.time]?.closeError()
      delete outcomeSignalSet[data.time]
    } else if (data.type === 'cancel') {
      displayLeft.open(data.time, `${data.duration}ms`).closeCancel()
      delete outcomeSignalSet[data.time]
    }
  })

  // Backing up and restoring the canvas image
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      imageStorage.saveImage(page.canvasLeft, now())
    }
  })
  let imageDataUrl = imageStorage.loadImage(now())
  if (imageDataUrl) {
    loadImage(imageDataUrl).then(displayLeft.restore)
  } else {
    displayLeft.wipe() // make the canvas non-transparent and grey
  }
}

main()
