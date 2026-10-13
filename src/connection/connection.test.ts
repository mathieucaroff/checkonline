import { parseConfig } from '../config'
import { loadImage } from '../util/loadImage'
import { pingTest } from './connection'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../util/loadImage', () => ({ loadImage: vi.fn() }))

describe('one-shot simulated failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.mocked(loadImage).mockResolvedValue({} as HTMLImageElement)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each(['?fail=1#period=500ms', '#fail#period=500ms', '#period=500ms'])(
    'consumes fail once when the URL suffix is %s',
    async (suffix) => {
      const location = new URL(`https://example.test/${suffix}`)
      const storage: ConfigStorage = {
        clear: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      }
      const replaceState = vi.fn((_state, _title, href: string) => {
        location.href = href
      })
      vi.stubGlobal('history', { state: null, replaceState })
      const config = parseConfig(storage, location as unknown as Location)
      config.fail = true

      const firstPing = pingTest(config, storage, location as unknown as Location)
      const failure = expect(firstPing).rejects.toBe('fake timeout')
      expect(config.fail).toBe(false)
      expect(loadImage).not.toHaveBeenCalled()

      await expect(pingTest(config, storage, location as unknown as Location)).resolves.toBe(0)
      expect(loadImage).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(500)
      await failure

      expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith('fail')
      expect(location.href).toBe('https://example.test/#period=500ms')
      expect(replaceState).toHaveBeenCalledTimes(suffix.includes('fail') ? 1 : 0)
    },
  )
})
