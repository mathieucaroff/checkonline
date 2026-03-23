/**
 * Everything related to rendering on a canvas is handled in the display module
 */
import { THEME } from '../theme'
import { XYPair } from '../type'
import { getDrawText } from '../util/drawText'
import { getContext2d } from '../util/getContext'
import { parseTimeToMs } from '../util/parseTimeToMs'
import { minuteOf } from '../util/time'

function getHeadLocation(time: number): XYPair & { eighthY: number } {
  let p = time
  let y8 = p % 8 // minor y coordinate
  let x = Math.floor(p / 8) % (60 * 15) // x coordinate
  let y4 = Math.floor(p / (8 * 60 * 15)) % 4 // major y coordinate
  let y24 = Math.floor(p / (8 * 60 * 15 * 4)) % 24 // major y coordinate

  return {
    x,
    y: 1 + (8 + 1) * y4 + ((8 + 1) * 4 + 1) * y24,
    eighthY: y8,
  }
}

function computeFillRectList(eighthY: number, period: number): NumberQuadruplet[] {
  let fillRectList: NumberQuadruplet[] = []
  let currentX = 0
  let currentPeriod = period

  // First fillRect call
  if (eighthY > 0) {
    // Fill either:
    // - just the few remaining missing pixels
    // - the whole remaining of the line of eight pixels
    let h = Math.min(period, 8 - eighthY)
    fillRectList.push([0, eighthY, 1, h])
    currentX += 1
    currentPeriod -= h
  }

  // Second fillRect call
  if (currentPeriod >= 8) {
    let w = Math.floor(currentPeriod / 8)
    fillRectList.push([currentX, 0, w, 8])
    currentX += w
    currentPeriod -= w * 8
  }

  // Third and last call
  if (currentPeriod > 0) {
    let h = currentPeriod
    fillRectList.push([currentX, 0, 1, h])
  }
  return fillRectList
}

export interface DisplayProp {
  canvas: HTMLCanvasElement
  /**
   * dayName - A string specifying the current day, to be written at the top left corner of the display
   */
  dayName: string
}

export let createDisplay = ({ canvas, dayName }: DisplayProp) => {
  let { ctx } = getContext2d(canvas)
  let lastTime = 0

  const restore = (image: HTMLImageElement) => {
    ctx.drawImage(image, 0, 0)
  }

  const wipe = () => {
    ctx.fillStyle = THEME.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const open = (targetTime: number, textPeriod: string) => {
    let pixelTime = (8 * targetTime) / 1000
    let period = (8 * parseTimeToMs(textPeriod)) / 1000

    let { x, y, eighthY } = getHeadLocation(pixelTime)

    let fillRectList = computeFillRectList(eighthY, period)

    const fillArea = () => {
      fillRectList.forEach(([dx, dy, w, h]) => ctx.fillRect(x + dx, y + dy, w, h))
    }

    ctx.fillStyle = THEME.open
    if ((pixelTime / 8) % 60 === 1) {
      me.drawWireframe()
    }
    // periodically redraw the wireframe:
    // - redraw whenever one second of a new minute starts has passed
    // - redraw after 12 seconds of a new minute have passed
    if (
      minuteOf(lastTime - 1000) < minuteOf(targetTime - 1000) ||
      minuteOf(lastTime - 12 * 1000) < minuteOf(targetTime - 12 * 1000)
    ) {
      me.drawWireframe()
    }

    lastTime = targetTime

    return {
      closeSuccess: () => {
        ctx.fillStyle = THEME.success
        fillArea()
      },
      closeError: () => {
        ctx.fillStyle = THEME.failure
        fillArea()
      },
      closeCancel: () => {
        ctx.fillStyle = THEME.cancel
        fillArea()
      },
    }
  }

  // Rulers and indications
  getDrawText().then((drawer) => {
    me.drawWireframe = () => {
      let bg = THEME.textbg

      Array.from({ length: 25 }, (_, k25) => {
        // hour labels
        // 8 pixels for drawing and one for quarter-hour separation
        // 4 rows per hour and one extra for hour separation
        let y = ((8 + 1) * 4 + 1) * k25
        if (k25 > 0) {
          // position 0 is reserved for the date of the day
          drawer.drawText(ctx, { y, x: 0 }, ` ${k25}`.slice(-2), bg)
        }

        // dots
        ctx.fillStyle = THEME.ruler
        Array.from({ length: 1920 / 2 / 5 }, (_, k192) => {
          ctx.fillRect(k192 * 5, y - 1, 1, 2)
        })
        Array.from({ length: 15 }, (_, k15) => {
          ctx.fillRect(k15 * 60, y - 5, 1, 10)
        })
      })

      // date: "year-month-day"
      drawer.drawText(ctx, { y: 0, x: 0 }, dayName, bg)
    }

    me.drawWireframe()
  })

  let me = {
    open,
    wipe,
    restore,
    setDayName: (newName: string) => {
      dayName = newName
    },
    drawWireframe: () => {},
  }

  return me
}
