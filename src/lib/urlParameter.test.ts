import { urlRemoveSearchAndHashParamAndLocalStorage } from './urlParameter'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('removing one-shot URL flags', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each<[string, string]>([
    ['?clear=1&right=2026-10-12', '?right=2026-10-12'],
    ['?clear=1#period=1s', '#period=1s'],
    ['?period=1s&clear=1&right=2026-10-12', '?period=1s&right=2026-10-12'],
    ['?period=1s&clear', '?period=1s'],
    ['?clear', ''],
    ['#clear', ''],
    ['#clear=1#period=1s', '#period=1s'],
    ['#period=1s#clear#right=2026-10-12', '#period=1s#right=2026-10-12'],
    ['#period=1s#clear=1', '#period=1s'],
    ['?clear=1&clear=2#clear#period=1s#clear=1', '#period=1s'],
    [
      '?clear=1#targetList=https://a.test/icon.ico==https://b.test/icon.ico',
      '#targetList=https://a.test/icon.ico==https://b.test/icon.ico',
    ],
    ['?clearer=1#clearer=2#clear', '?clearer=1#clearer=2'],
    ['?title=My%20Title#period=1s', '?title=My%20Title#period=1s'],
    ['#', '#'],
  ])('preserves the remaining URL when removing clear from %s', (input, expected) => {
    const base = 'https://example.test/checkonline/'
    const location = new URL(base + input) as unknown as Location
    const storage: ConfigStorage = {
      clear: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    }
    const state = { archive: '2026-10-12' }
    const replaceState = vi.fn()
    vi.stubGlobal('history', { state, replaceState })

    urlRemoveSearchAndHashParamAndLocalStorage(location, storage, 'clear')

    expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith('clear')
    expect(location.href).toBe(base + input)
    if (input === expected) {
      expect(replaceState).not.toHaveBeenCalled()
    } else {
      expect(replaceState).toHaveBeenCalledExactlyOnceWith(state, '', base + expected)
    }
  })

  it('removes fail from both query and hash without removing clear', () => {
    const location = new URL('https://example.test/?fail=1&clear=1#fail#period=1s')
    const storage: ConfigStorage = {
      clear: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    }
    const replaceState = vi.fn()
    vi.stubGlobal('history', { state: null, replaceState })

    urlRemoveSearchAndHashParamAndLocalStorage(location as unknown as Location, storage, 'fail')

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      null,
      '',
      'https://example.test/?clear=1#period=1s',
    )
    expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith('fail')
  })
})
