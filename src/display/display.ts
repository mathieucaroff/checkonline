/**
 * Everything related to rendering on a canvas is handled in the display module
 */
import { THEME } from '../theme'
import { Pair } from '../type'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { getContext2d } from '../util/getContext'
import { parseTimeToMs } from '../util/parseTimeToMs'
import { minuteOf } from '../util/time'

function getHeadLocation(time: number): Pair {
  let y8 = time % 8 // minor y coordinate
  let y4 = Math.floor(time / 8) % 4 // major y coordinate
  let x = Math.floor(time / (8 * 4)) % (60 * 15) // x coordinate
  let y24 = Math.floor(time / (8 * 4 * 60 * 15)) % 24 // major y coordinate

  return {
    x,
    y: 1 + y8 + (8 + 1) * y4 + ((8 + 1) * 4 + 1) * y24,
  }
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

    pixelTime -= pixelTime % period
    let { x, y } = getHeadLocation(pixelTime)
    let [w, h] = divmod(period + 8 - 1, 8) // -1
    h += 1 // +1

    const fillArea = () => {
      Array.from({ length: w }, (_, dy) => {
        if (dy === 0) {
          // do not draw on the hour labels
          if (x < 13) return
          // do not draw on the top left day label
          if (y === 0 && x < 61) return
        }
        ctx.fillRect(x, y + dy * (8 + 1), 1, h)
      })
    }

    ctx.fillStyle = THEME.open
    fillArea()
    if (x % 60 === 1) {
      me.drawWireframe()
    }
    // periodically redraw the wireframe:
    // - redraw whenever one second of a new minute start has passed
    if (minuteOf(lastTime - 1000) < minuteOf(targetTime - 1000)) {
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
        // every minute
        Array.from({ length: 60 }, (_, k60) => {
          ctx.fillRect(k60 * 15, y - 1, 1, 2)
        })
        // every 5 minutes
        Array.from({ length: 60 / 5 }, (_, k12) => {
          ctx.fillRect((k12 * 900) / 12, y - 2, 1, 4)
        })
        // every 15 minutes
        Array.from({ length: 60 / 15 }, (_, k4) => {
          ctx.fillRect((k4 * 900) / 4, y - 5, 1, 10)
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
