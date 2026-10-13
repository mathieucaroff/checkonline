import { createClock } from './clock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('createClock', () => {
  const initialTime = Date.UTC(2026, 9, 13)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(initialTime)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('waits for each scheduled target and preserves offset and previous time', () => {
    const callback = vi.fn()
    const offset = 60_000
    createClock(500, offset, 4000, callback)

    vi.advanceTimersByTime(0)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenNthCalledWith(1, initialTime - offset, undefined, 0)

    vi.advanceTimersByTime(499)
    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenNthCalledWith(2, initialTime + 500 - offset, initialTime - offset, 0)

    vi.advanceTimersByTime(499)
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenNthCalledWith(
      3,
      initialTime + 1000 - offset,
      initialTime + 500 - offset,
      0,
    )
  })

  it('realigns the next tick after lateness below the skip threshold', () => {
    const callback = vi.fn()
    createClock(500, 0, 4000, callback)
    vi.advanceTimersByTime(0)

    vi.setSystemTime(initialTime + 125)
    vi.advanceTimersByTime(500)
    expect(callback).toHaveBeenNthCalledWith(2, initialTime + 500, initialTime, 0)

    vi.advanceTimersByTime(374)
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenNthCalledWith(3, initialTime + 1000, initialTime + 500, 0)
    expect(Date.now()).toBe(initialTime + 1000)
  })

  it('recomputes the next delay after skipping overdue ticks', () => {
    const callback = vi.fn()
    createClock(500, 0, 4000, callback)
    vi.advanceTimersByTime(0)

    vi.setSystemTime(initialTime + 4250)
    vi.advanceTimersByTime(500)
    expect(callback).toHaveBeenNthCalledWith(2, initialTime + 4500, initialTime, 4250)

    vi.advanceTimersByTime(249)
    expect(callback).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenNthCalledWith(3, initialTime + 5000, initialTime + 4500, 0)
    expect(Date.now()).toBe(initialTime + 5000)
  })

  it('clamps an overdue next target to a zero delay', () => {
    const callback = vi.fn()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    createClock(500, 0, 4000, callback)
    vi.advanceTimersByTime(0)

    vi.spyOn(Date, 'now').mockReturnValue(initialTime + 1750)
    vi.advanceTimersByTime(500)

    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 0)
    expect(callback).toHaveBeenNthCalledWith(2, initialTime + 500, initialTime, 0)
  })

  it('stops scheduling callbacks when disposed', () => {
    const callback = vi.fn()
    const clock = createClock(500, 0, 4000, callback)
    vi.advanceTimersByTime(0)

    clock.dispose()
    vi.advanceTimersByTime(2000)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
