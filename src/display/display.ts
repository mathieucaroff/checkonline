import { THEME } from '../theme'
import { CheckOnlineConfig } from '../type'
import { day } from '../util/day'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { getContext2d } from '../util/getContext'
import { parseTimeToMs } from '../util/parseTimeToMs'

let getHeadLocation = (p: number) => {
  let [q, y8] = divmod(p, 8) // eigth of seconds ~ x coordinate
  let [r, x] = divmod(q, 15 * 60) // one quarter hour is 15 minutes and one minute is 60 seconds
  let [_, y1] = divmod(r, 24 * 4) // one day is 24 hours and one hour is 4 quarter hours
  return { y: y8 + 8 * y1, x }
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

    ctx.fillStyle = THEME.open
    ctx.fillRect(x, y, w, h)
    if (x % 60 === 1) {
      me.drawTimeIndicator()
    }

    return {
      closeSuccess: () => {
        ctx.fillStyle = THEME.success
        ctx.fillRect(x, y, w, h)
      },
      closeError: () => {
        ctx.fillStyle = THEME.failure
        ctx.fillRect(x, y, w, h)
      },
      closeCancel: () => {
        ctx.fillStyle = THEME.cancel
        ctx.fillRect(x, y, w, h)
      },
    }
  }

  // Rulers and indications
  getDrawText().then((drawer) => {
    me.drawTimeIndicator = () => {
      let bg = THEME.textbg

      Array.from({ length: 25 }, (_, k25) => {
        // hour labels
        let y = 8 * 4 * k25 // 8 pixels, 4 rows per hour
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

    me.drawTimeIndicator()
  })

  let me = {
    open,
    wipe,
    restore,
    setDayName: (newName: string) => {
      dayName = newName
    },
    drawTimeIndicator: () => {},
  }

  return me
}
