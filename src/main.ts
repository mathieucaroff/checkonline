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
import { loadImage } from './util/loadImage'
import { parseTimeToMs } from './util/parseTimeToMs'
import { day, dayOf } from './util/time'

function main() {
  const oneDay = 86_400_000

  const configStorage = createKeyStorage<SavedConfig>(localStorage, packageInfo.name)

  const action: ActionObject = {
    clear() {
      generation += 1
      imageStorage.removeImage(now())
      displayLeft.wipe()
      displayLeft.drawWireframe()
    },
    setPeriod(period) {
      updateConfig({ ...config, period })
    },
    setReactivity(reactivity) {
      updateConfig({ ...config, reactivity })
    },
    setArchiveDisplayDate(date) {
      updateConfig({ ...config, right: date })
    },
  }

  const state: State = { status: 'unknown' }

  const config = parseConfig(configStorage, location)
  const page = createPage(config, state, configStorage, action)
  document.body.appendChild(page.content)
  let displayLeft = createDisplay({
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

  interface DayRecording {
    display: ReturnType<typeof createDisplay>
    canvas: HTMLCanvasElement
    date: Date
    pending: number
    archived: boolean
  }

  let recording: DayRecording = {
    display: displayLeft,
    canvas: page.canvasLeft,
    date: now(),
    pending: 0,
    archived: false,
  }
  const pendingArchives = new Set<DayRecording>()
  let generation = 0
  let sequence = 0
  let latestAcceptedSequence = 0
  let restoringRecording: DayRecording | undefined

  const saveRecording = (current: DayRecording) => {
    if (current === restoringRecording) {
      return false
    }
    try {
      imageStorage.saveImage(current.canvas, current.date)
      return true
    } catch (error) {
      console.error(`Unable to save history for ${day(current.date)}`, error)
      return false
    }
  }

  const finalizeArchive = (completed: DayRecording) => {
    if (!completed.archived || completed.pending > 0) {
      return
    }
    if (!saveRecording(completed)) {
      return
    }
    pendingArchives.delete(completed)
    if (config.right === day(completed.date)) {
      displayRight.restore(completed.canvas)
    }
  }

  const saveHistory = () => {
    saveRecording(recording)
    pendingArchives.forEach((archive) => {
      if (archive.pending === 0) {
        finalizeArchive(archive)
      } else {
        saveRecording(archive)
      }
    })
  }

  let favicon = document.getElementById('favicon') as HTMLLinkElement
  let faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
  let faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

  /**
   * ping
   * @param time - time to use to write the ping result to the canvas
   */
  const ping = (time: number, _lastTime: number | undefined, skip: number) => {
    if (dayOf(recording.date.getTime()) !== dayOf(time)) {
      handleEndOfDay(new Date(time))
    }

    let dailyTime = time % oneDay
    if (skip > 0) {
      displayLeft.open(dailyTime - skip, `${skip}ms`).closeCancel()
      return
    }

    let periodwiseTime = dailyTime - (dailyTime % parseTimeToMs(config.period))
    const currentRecording = recording
    const probeGeneration = generation
    const probeSequence = ++sequence
    const closer = currentRecording.display.open(periodwiseTime, config.period)
    currentRecording.pending += 1

    const complete = (status: 'connected' | 'disconnected') => {
      if (probeGeneration !== generation) {
        return
      }
      if (status === 'connected') {
        closer.closeSuccess()
      } else {
        closer.closeError()
      }

      if (currentRecording !== recording || probeSequence < latestAcceptedSequence) {
        return
      }
      latestAcceptedSequence = probeSequence
      if (state.status !== status) {
        state.status = status
        const connected = status === 'connected'
        favicon.href = connected ? faviconConnected.href : faviconDisconnected.href
        document.title = connected ? config.connectedTitle : config.disconnectedTitle
        const background = connected ? THEME.connected : THEME.disconnected
        document.documentElement.style.backgroundColor = background
        document.body.style.backgroundColor = background
      }
    }

    pingTest(config, configStorage, location)
      .then(
        () => complete('connected'),
        () => complete('disconnected'),
      )
      .finally(() => {
        currentRecording.pending -= 1
        finalizeArchive(currentRecording)
      })
  }

  const handleEndOfDay = (nextDay: Date) => {
    const completed = recording
    completed.canvas = completed.display.detach()
    completed.archived = true
    pendingArchives.add(completed)
    displayLeft = createDisplay({ canvas: page.canvasLeft, dayName: day(nextDay) })
    recording = {
      display: displayLeft,
      canvas: page.canvasLeft,
      date: nextDay,
      pending: 0,
      archived: false,
    }
    console.log(`handleEndOfDay (${day(completed.date)})`)
    displayLeft.wipe()
    displayLeft.drawWireframe()
    finalizeArchive(completed)
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
      config.clear = false
      action.clear()
      urlRemoveSearchAndHashParamAndLocalStorage(location, configStorage, 'clear')
    }

    if (
      config.period !== lastConfig.period ||
      config.timezoneOffset !== lastConfig.timezoneOffset ||
      config.reactivity !== lastConfig.reactivity ||
      config.punctualityThreshold !== lastConfig.punctualityThreshold ||
      config.targetList !== lastConfig.targetList ||
      config.fail !== lastConfig.fail
    ) {
      generation += 1
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
      displayRight.drawWireframe()
    }
  }

  applyConfig(config, {} as any)

  window.addEventListener('hashchange', () => updateConfig(parseConfig(configStorage, location)))

  // Backing up and restoring the canvas image
  window.addEventListener('beforeunload', saveHistory)
  window.addEventListener('pagehide', saveHistory)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveHistory()
    }
  })
  const scheduleBackup = () => {
    setTimeout(() => {
      saveHistory()
      scheduleBackup()
    }, 60_000 - (Date.now() % 60_000))
  }
  scheduleBackup()
  let imageDataUrl = imageStorage.loadImage(now())
  if (imageDataUrl) {
    const initialRecording = recording
    restoringRecording = initialRecording
    loadImage(imageDataUrl)
      .then(initialRecording.display.restore)
      .catch((error) => {
        console.error(`Unable to restore history for ${day(initialRecording.date)}`, error)
      })
      .finally(() => {
        restoringRecording = undefined
        finalizeArchive(initialRecording)
      })
  } else {
    displayLeft.wipe() // make the canvas non-transparent and grey
  }
}

main()
