import { createDisplay } from './display'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../util/drawText', () => ({ getDrawText: () => new Promise(() => {}) }))

describe('detaching a day display', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copies the day and directs pending closers to the archive rather than the reused canvas', () => {
    const visibleContext = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
    const archivedContext = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
    const canvas = {
      width: 900,
      height: 888,
      getContext: () => visibleContext,
    } as unknown as HTMLCanvasElement
    const archivedCanvas = {
      width: 0,
      height: 0,
      getContext: () => archivedContext,
    } as unknown as HTMLCanvasElement
    vi.stubGlobal('document', { createElement: () => archivedCanvas })
    const oldDisplay = createDisplay({ canvas, dayName: '2026-10-13' })
    const closer = oldDisplay.open(86_399_500, '500ms')

    expect(oldDisplay.detach()).toBe(archivedCanvas)
    expect(archivedContext.drawImage).toHaveBeenCalledExactlyOnceWith(canvas, 0, 0)
    expect(archivedCanvas.width).toBe(900)
    expect(archivedCanvas.height).toBe(888)

    const nextDisplay = createDisplay({ canvas, dayName: '2026-10-14' })
    nextDisplay.wipe()
    visibleContext.fillRect.mockClear()
    closer.closeSuccess()

    expect(visibleContext.fillRect).not.toHaveBeenCalled()
    expect(archivedContext.fillRect).toHaveBeenCalledExactlyOnceWith(899, 883, 1, 4)
  })
})
