import { CheckOnlineConfig } from '../type'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { getContext2d } from '../util/getContext'
import { parseTimeToMs } from '../util/parseTimeToMs'

const THEME = {
  disconnected: '#f77',
  connected: '#000',
  background: '#111',
  ruler: '#ccc',
  textbg: '#ccc',
  open: '#dd2',
  success: '#5c5',
  failure: '#e55',
}

let getHeadLocation = (p: number) => {
  let [q, y8] = divmod(p, 8) // eigth of seconds ~ x coordinate
  let [r, x] = divmod(q, 15 * 60) // one quarter hour is 15 minutes and one minute is 60 seconds
  let [_, y1] = divmod(r, 24 * 4) // one day is 24 hours and one hour is 4 quarter hours
  return { y: y8 + 8 * y1, x }
}

export interface DisplayProp {
  document: Document
  canvas: HTMLCanvasElement
  config: CheckOnlineConfig
}

export let createDisplay = ({ document, canvas, config }: DisplayProp) => {
  let { ctx } = getContext2d(canvas)
  let status: 'unknown' | 'connected' | 'disconnected' = 'unknown'

  let favicon = document.getElementById('favicon') as HTMLLinkElement
  let faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
  let faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

  const restore = (image: HTMLImageElement) => {
    ctx.drawImage(image, 0, 0)
  }

  const wipe = () => {
    ctx.fillStyle = THEME.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const open = (targetTime: number) => {
    let pixelTime = (8 * targetTime) / 1000
    let period = (8 * parseTimeToMs(config.period)) / 1000

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

        if (status !== 'connected') {
          status = 'connected'
          favicon.href = faviconConnected.href
          document.title = config.connectedTitle
          document.documentElement.style.backgroundColor = THEME.connected
          document.body.style.backgroundColor = THEME.connected
        }
      },
      closeError: () => {
        ctx.fillStyle = THEME.failure
        ctx.fillRect(x, y, w, h)

        if (status !== 'disconnected') {
          status = 'disconnected'
          favicon.href = faviconDisconnected.href
          document.title = config.disconnectedTitle
          document.documentElement.style.backgroundColor = THEME.disconnected
          document.body.style.backgroundColor = THEME.disconnected
        }
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
        drawer.drawText(ctx, { y, x: 0 }, ` ${k25}`.slice(-2), bg)

        // dots
        ctx.fillStyle = THEME.ruler
        Array.from({ length: 1920 / 2 / 5 }, (_, k192) => {
          ctx.fillRect(k192 * 5, y - 1, 1, 2)
        })
        Array.from({ length: 15 }, (_, k15) => {
          ctx.fillRect(k15 * 60, y - 5, 1, 10)
        })
      })
    }

    me.drawTimeIndicator()
  })

  let me = {
    open,
    wipe,
    restore,
    drawTimeIndicator: () => {},
  }

  return me
}
