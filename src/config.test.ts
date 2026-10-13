import { parseConfig } from './config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('configuration durations', () => {
  const storage: ConfigStorage = {
    clear: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  }

  const locationWithHash = (hash: string) => {
    const location = new URL('https://example.test/')
    location.hash = hash
    return Object.assign(location, {
      replace: (href: string) => {
        location.href = href
      },
    }) as unknown as Location
  }

  beforeEach(() => {
    vi.clearAllMocks()
    storage.getItem = vi.fn()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T00:30:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('preserves a zero timezone offset and computes yesterday correctly', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0)
    const config = parseConfig(storage, locationWithHash(''))

    expect(config.timezoneOffset).toBe('0m')
    expect(config.right).toBe('2026-10-12')
  })

  it('allows negative timezone offsets', () => {
    const config = parseConfig(storage, locationWithHash('#timezoneOffset=-120m'))
    expect(config.timezoneOffset).toBe('-120m')
  })

  it.each(['period', 'reactivity', 'punctualityThreshold'])(
    'rejects unsafe URL values for %s with the setting name',
    (key) => {
      for (const duration of ['0ms', '-1s', '.5ms', '25d', 'garbage', 'Infinity']) {
        expect(() => parseConfig(storage, locationWithHash(`#${key}=${duration}`))).toThrow(
          `Invalid configuration "${key}"`,
        )
      }
    },
  )

  it.each(['period', 'reactivity'])('rejects an unsafe saved %s', (key) => {
    storage.getItem = vi
      .fn()
      .mockImplementation((savedKey) => (savedKey === key ? '0ms' : undefined))

    expect(() => parseConfig(storage, locationWithHash(''))).toThrow(
      `Invalid configuration "${key}"`,
    )
  })

  it.each(['garbage', 'Infinity', '1s trailing'])(
    'rejects invalid timezone offset %s',
    (duration) => {
      expect(() =>
        parseConfig(storage, locationWithHash(`#timezoneOffset=${duration}#right=2026-10-12`)),
      ).toThrow('Invalid configuration "timezoneOffset"')
    },
  )

  it('accepts the upper browser timer bound', () => {
    const config = parseConfig(storage, locationWithHash('#period=2147483647ms'))
    expect(config.period).toBe('2147483647ms')
  })
})
