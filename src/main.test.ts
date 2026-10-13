import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  removeImage: vi.fn(),
  removeItem: vi.fn(),
  saveImage: vi.fn(),
  loadSavedImage: vi.fn<() => string | null>(),
  loadImage: vi.fn<(url: string) => Promise<HTMLImageElement>>(),
  addEventListener: vi.fn<(event: string, listener: EventListener) => void>(),
  pingTest: vi.fn<() => Promise<number>>(),
  createClock: vi.fn(
    (
      _period: number,
      _offset: number,
      _threshold: number,
      _callback: (time: number, lastTime: number | undefined, skip: number) => void,
    ) => ({ dispose: vi.fn() }),
  ),
  createDisplay: vi.fn((_props: { canvas: HTMLCanvasElement; dayName: string }) => ({
    wipe: vi.fn(),
    drawWireframe: vi.fn(),
    setDayName: vi.fn(),
    restore: vi.fn(),
    detach: vi.fn(() => ({} as HTMLCanvasElement)),
    open: vi.fn(() => ({
      closeSuccess: vi.fn(),
      closeError: vi.fn(),
      closeCancel: vi.fn(),
    })),
  })),
  createPage: vi.fn(
    (
      _config: CheckOnlineConfig,
      _state: State,
      _storage: ConfigStorage,
      _action: ActionObject,
    ) => ({
      content: {},
      canvasLeft: {},
      canvasRight: {},
    }),
  ),
}))

vi.mock('./clock/clock', () => ({ createClock: mocks.createClock }))
vi.mock('./connection/connection', () => ({ pingTest: mocks.pingTest }))
vi.mock('./util/loadImage', () => ({ loadImage: mocks.loadImage }))
vi.mock('./page/page', () => ({ createPage: mocks.createPage }))
vi.mock('./display/display', () => ({
  createDisplay: mocks.createDisplay,
}))
vi.mock('./storage/storage', () => ({
  createKeyStorage: () => ({ getItem: vi.fn(), removeItem: mocks.removeItem }),
}))
vi.mock('./storage/imageStorage', () => ({
  createImageStorage: () => ({
    removeImage: mocks.removeImage,
    saveImage: mocks.saveImage,
    loadImage: mocks.loadSavedImage,
    loadImageFromDay: vi.fn(() => null),
  }),
}))

describe('probe recording lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.saveImage.mockReset()
    mocks.loadSavedImage.mockReset().mockReturnValue(null)
    mocks.loadImage.mockReset()
    mocks.pingTest.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T23:59:59.500Z'))
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0)
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.stubGlobal('localStorage', {})
    vi.stubGlobal('window', { addEventListener: mocks.addEventListener })
    vi.stubGlobal('document', {
      addEventListener: mocks.addEventListener,
      visibilityState: 'visible',
      body: { appendChild: vi.fn(), style: {} },
      documentElement: { style: {} },
      getElementById: (id: string) => ({ href: id }),
      title: '',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const start = async (suffix = '#period=500ms#timezoneOffset=0m') => {
    const location = new URL(`https://example.test/${suffix}`)
    const replaceState = vi.fn((_state, _title, href: string) => {
      location.href = href
    })
    vi.stubGlobal('location', location)
    vi.stubGlobal('history', { state: null, replaceState })
    await import('./main')
    const [config, state, , action] = mocks.createPage.mock.calls[0]
    return {
      config,
      state,
      action,
      location,
      replaceState,
      tick: mocks.createClock.mock.calls[0][3],
      left: mocks.createDisplay.mock.results[0].value,
      right: mocks.createDisplay.mock.results[1].value,
    }
  }

  const deferredProbe = () => {
    let resolve!: (value: number) => void
    let reject!: (reason: string) => void
    const promise = new Promise<number>((success, failure) => {
      resolve = success
      reject = failure
    })
    mocks.pingTest.mockReturnValueOnce(promise)
    return { promise, resolve, reject }
  }

  const flush = async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  }

  const emit = (event: string) => {
    const listener = mocks.addEventListener.mock.calls.find(([type]) => type === event)![1]
    listener(new Event(event))
  }

  it('does not overwrite stored history before startup restoration finishes', async () => {
    let finishRestore!: (image: HTMLImageElement) => void
    const restored = new Promise<HTMLImageElement>((resolve) => {
      finishRestore = resolve
    })
    mocks.loadSavedImage.mockReturnValue('data:image/png;base64,saved')
    mocks.loadImage.mockReturnValue(restored)
    const { left } = await start()

    vi.advanceTimersByTime(500)
    emit('pagehide')
    expect(mocks.saveImage).not.toHaveBeenCalled()

    const image = {} as HTMLImageElement
    finishRestore(image)
    await flush()
    emit('pagehide')
    expect(left.restore).toHaveBeenCalledExactlyOnceWith(image)
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
  })

  it('reports a restore failure and allows subsequent backups', async () => {
    const error = new Error('Invalid saved image')
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.loadSavedImage.mockReturnValue('data:image/png;base64,invalid')
    mocks.loadImage.mockRejectedValue(error)
    await start()
    await flush()

    emit('pagehide')
    expect(report).toHaveBeenCalledWith('Unable to restore history for 2026-10-13', error)
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
  })

  it('backs up at each minute boundary without waiting for an unload event', async () => {
    vi.setSystemTime(new Date('2026-10-13T12:34:30Z'))
    await start()

    vi.advanceTimersByTime(29_999)
    expect(mocks.saveImage).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(60_000)
    expect(mocks.saveImage).toHaveBeenCalledTimes(2)
  })

  it.each(['visibilitychange', 'pagehide', 'beforeunload'])(
    'backs up both the current day and pending archive on %s',
    async (event) => {
      const { tick, left } = await start()
      const previous = deferredProbe()
      const current = deferredProbe()
      const previousTime = Date.now()
      tick(previousTime, undefined, 0)
      vi.setSystemTime(previousTime + 500)
      tick(previousTime + 500, previousTime, 0)
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' })

      emit(event)

      expect(mocks.saveImage).toHaveBeenCalledTimes(2)
      expect(mocks.saveImage).toHaveBeenLastCalledWith(
        left.detach.mock.results[0].value,
        new Date(previousTime),
      )
      previous.resolve(10)
      current.resolve(10)
      await flush()
    },
  )

  it('does not save when visibility changes to visible', async () => {
    await start()
    emit('visibilitychange')
    expect(mocks.saveImage).not.toHaveBeenCalled()
  })

  it('continues backing up other recordings after a save failure', async () => {
    const error = new Error('Storage quota exceeded')
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { tick, left, state } = await start()
    const previous = deferredProbe()
    const current = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime, undefined, 0)
    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, previousTime, 0)
    mocks.saveImage.mockImplementationOnce(() => {
      throw error
    })

    expect(() => emit('pagehide')).not.toThrow()
    expect(report).toHaveBeenCalledWith('Unable to save history for 2026-10-14', error)
    expect(mocks.saveImage).toHaveBeenCalledTimes(2)
    expect(mocks.saveImage).toHaveBeenLastCalledWith(
      left.detach.mock.results[0].value,
      new Date(previousTime),
    )
    current.resolve(10)
    previous.resolve(10)
    await flush()
    expect(state.status).toBe('connected')
  })

  it('retries failed periodic saves on the next minute', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.setSystemTime(new Date('2026-10-13T12:34:30Z'))
    await start()
    mocks.saveImage.mockImplementationOnce(() => {
      throw new Error('Storage blocked')
    })

    expect(() => vi.advanceTimersByTime(30_000)).not.toThrow()
    expect(report).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(60_000)
    expect(mocks.saveImage).toHaveBeenCalledTimes(2)
  })

  it('retains a finalized archive for retry after a save failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { tick, left } = await start()
    const previous = deferredProbe()
    const current = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime, undefined, 0)
    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, previousTime, 0)
    mocks.saveImage.mockImplementationOnce(() => {
      throw new Error('Storage blocked')
    })
    previous.resolve(10)
    await flush()
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)

    emit('pagehide')
    expect(mocks.saveImage).toHaveBeenCalledTimes(3)
    expect(mocks.saveImage).toHaveBeenLastCalledWith(
      left.detach.mock.results[0].value,
      new Date(previousTime),
    )
    emit('pagehide')
    expect(mocks.saveImage).toHaveBeenCalledTimes(4)
    current.resolve(10)
    await flush()
  })

  it('does not clear again when configuration is updated without a reload', async () => {
    const { config, action, location, replaceState } = await start('?clear=1#period=500ms')
    expect(config.clear).toBe(false)
    expect(mocks.removeImage).toHaveBeenCalledTimes(1)
    expect(mocks.removeItem).toHaveBeenCalledExactlyOnceWith('clear')
    expect(location.href).toBe('https://example.test/#period=500ms')

    action.setReactivity('1s')

    expect(mocks.removeImage).toHaveBeenCalledTimes(1)
    expect(mocks.removeItem).toHaveBeenCalledTimes(1)
    expect(replaceState).toHaveBeenCalledTimes(1)
  })

  it.each(['success', 'failure'] as const)(
    'retains a previous-day %s in its archive without changing the current status',
    async (outcome) => {
      const { tick, left, right, state } = await start()
      const oldProbe = deferredProbe()
      const newProbe = deferredProbe()
      const previousTime = Date.now()
      tick(previousTime, undefined, 0)
      const oldCloser = left.open.mock.results[0].value

      vi.setSystemTime(previousTime + 500)
      tick(previousTime + 500, previousTime, 0)
      const currentDisplay = mocks.createDisplay.mock.results[2].value
      const newCloser = currentDisplay.open.mock.results[0].value
      expect(left.detach).toHaveBeenCalledTimes(1)
      expect(mocks.saveImage).not.toHaveBeenCalled()

      newProbe.resolve(10)
      await flush()
      expect(state.status).toBe('connected')
      if (outcome === 'success') oldProbe.resolve(20)
      else oldProbe.reject('timeout')
      await flush()

      expect(oldCloser.closeSuccess).toHaveBeenCalledTimes(outcome === 'success' ? 1 : 0)
      expect(oldCloser.closeError).toHaveBeenCalledTimes(outcome === 'failure' ? 1 : 0)
      expect(newCloser.closeSuccess).toHaveBeenCalledTimes(1)
      expect(newCloser.closeError).not.toHaveBeenCalled()
      expect(state.status).toBe('connected')
      const archivedCanvas = left.detach.mock.results[0].value
      expect(mocks.saveImage).toHaveBeenCalledExactlyOnceWith(
        archivedCanvas,
        new Date(previousTime),
      )
      expect(right.restore).toHaveBeenCalledExactlyOnceWith(archivedCanvas)
    },
  )

  it('waits for every previous-day probe before finalizing its archive', async () => {
    const { tick } = await start()
    const first = deferredProbe()
    const second = deferredProbe()
    const current = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime - 500, undefined, 0)
    tick(previousTime, previousTime - 500, 0)
    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, previousTime, 0)

    second.resolve(10)
    await flush()
    expect(mocks.saveImage).not.toHaveBeenCalled()
    first.reject('timeout')
    await flush()
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
    current.resolve(10)
    await flush()
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
  })

  it.each(['connected', 'disconnected'] as const)(
    'retains the newer %s status while recording both results',
    async (status) => {
      const { tick, left, state } = await start()
      const older = deferredProbe()
      const newer = deferredProbe()
      const time = Date.now() - 1000
      tick(time, undefined, 0)
      tick(time + 500, time, 0)

      if (status === 'connected') newer.resolve(10)
      else newer.reject('timeout')
      await flush()
      if (status === 'connected') older.reject('timeout')
      else older.resolve(10)
      await flush()

      expect(state.status).toBe(status)
      expect(left.open.mock.results[0].value.closeError).toHaveBeenCalledTimes(
        status === 'connected' ? 1 : 0,
      )
      expect(left.open.mock.results[0].value.closeSuccess).toHaveBeenCalledTimes(
        status === 'connected' ? 0 : 1,
      )
      expect(left.open.mock.results[1].value.closeSuccess).toHaveBeenCalledTimes(
        status === 'connected' ? 1 : 0,
      )
      expect(left.open.mock.results[1].value.closeError).toHaveBeenCalledTimes(
        status === 'connected' ? 0 : 1,
      )
      expect(document.body.style.backgroundColor).toBe(status === 'connected' ? '#000' : '#f77')
    },
  )

  it.each([
    'clear',
    'period',
    'reactivity',
    'targetList',
    'timezoneOffset',
    'punctualityThreshold',
  ])('invalidates a pending result after changing %s', async (change) => {
    const { tick, left, state, action, location } = await start()
    const probe = deferredProbe()
    tick(Date.now(), undefined, 0)
    const closer = left.open.mock.results[0].value

    if (change === 'clear') action.clear()
    else if (change === 'period') action.setPeriod('1s')
    else if (change === 'reactivity') action.setReactivity('1s')
    else {
      const value =
        change === 'timezoneOffset'
          ? '-60m'
          : change === 'punctualityThreshold'
          ? '5s'
          : 'https://example.test/icon.ico'
      location.hash += `#${change}=${value}`
      const listener = mocks.addEventListener.mock.calls.find(
        ([event]) => event === 'hashchange',
      )![1] as EventListener
      listener(new Event('hashchange'))
    }

    probe.resolve(10)
    await flush()
    expect(closer.closeSuccess).not.toHaveBeenCalled()
    expect(closer.closeError).not.toHaveBeenCalled()
    expect(state.status).toBe('unknown')
  })

  it('finalizes a settled day immediately even when the next tick has no previous time', async () => {
    const { tick, left } = await start()
    const previous = deferredProbe()
    const current = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime, undefined, 0)
    previous.resolve(10)
    await flush()

    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, undefined, 0)

    expect(mocks.saveImage).toHaveBeenCalledExactlyOnceWith(
      left.detach.mock.results[0].value,
      new Date(previousTime),
    )
    current.resolve(10)
    await flush()
  })

  it('does not replace a different archive selection when the pending day finishes', async () => {
    const { tick, action, right } = await start()
    const previous = deferredProbe()
    const current = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime, undefined, 0)
    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, previousTime, 0)
    action.setArchiveDisplayDate('2026-10-11')

    previous.resolve(10)
    await flush()
    expect(mocks.saveImage).toHaveBeenCalledTimes(1)
    expect(right.restore).not.toHaveBeenCalled()
    current.resolve(10)
    await flush()
  })

  it('backs up a detached unfinished day when unloading', async () => {
    const { tick, left } = await start()
    const pending = deferredProbe()
    const next = deferredProbe()
    const previousTime = Date.now()
    tick(previousTime, undefined, 0)
    vi.setSystemTime(previousTime + 500)
    tick(previousTime + 500, previousTime, 0)
    const listener = mocks.addEventListener.mock.calls.find(
      ([event]) => event === 'beforeunload',
    )![1] as EventListener

    listener(new Event('beforeunload'))
    expect(mocks.saveImage).toHaveBeenCalledTimes(2)
    expect(mocks.saveImage).toHaveBeenLastCalledWith(
      left.detach.mock.results[0].value,
      new Date(previousTime),
    )
    pending.resolve(10)
    next.resolve(10)
    await flush()
  })
})
