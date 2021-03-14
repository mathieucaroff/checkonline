import { OnlineConfig } from '../type/onlineConfig'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { getContext2d } from '../util/getContext'

let getHeadLocation = (p: number) => {
   let [q, y8] = divmod(p, 8) // eigth of seconds ~ x coordinate
   let [r, x] = divmod(q, 15 * 60) // one quarter hour is 15 minutes and one minute is 60 seconds
   let [_, y1] = divmod(r, 24 * 4) // one day is 24 hours and one hour is 4 quarter hours
   return { y: y8 + 8 * y1, x }
}

export interface DisplayProp {
   canvas: HTMLCanvasElement
   getConfig: () => OnlineConfig
}

export let createDisplay = ({ canvas, getConfig }: DisplayProp) => {
   let { ctx } = getContext2d(canvas)

   const restore = (image: HTMLImageElement) => {
      ctx.drawImage(image, 0, 0)
   }

   const wipe = () => {
      ctx.fillStyle = getConfig().themeObject.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
   }

   const open = (targetTime: number) => {
      let pixelTime = (8 * targetTime) / 1000
      let { debug, pixelPeriod } = getConfig()

      pixelTime -= pixelTime % pixelPeriod
      let { x, y } = getHeadLocation(pixelTime)
      let [w, h] = divmod(pixelPeriod + 8 - 1, 8) // -1
      h += 1 // +1

      let theme = getConfig().themeObject
      ctx.fillStyle = theme.open
      ctx.fillRect(x, y, w, h)
      if (debug || x % 480 <= 2 * h) {
         drawTimeIndicator()
      }

      return {
         closeSuccess: () => {
            ctx.fillStyle = theme.success
            ctx.fillRect(x, y, w, h)
         },
         closeError: () => {
            ctx.fillStyle = theme.failure
            ctx.fillRect(x, y, w, h)
         },
      }
   }

   let drawTimeIndicator = () => {}
   // Rulers and indications
   getDrawText().then((drawer) => {
      drawTimeIndicator = () => {
         let bg = getConfig().themeObject.textbg

         Array.from({ length: 24 }, (_, k24) => {
            // hour labels
            let y = 8 * 4 * k24 // 8 pixels, 4 rows per hour
            drawer.drawText(ctx, { y, x: 0 }, ` ${k24}`.slice(-2), bg)

            // dots
            ctx.fillStyle = getConfig().themeObject.ruler
            Array.from({ length: 1920 / 2 / 8 }, (_, k240) => {
               ctx.fillRect(k240 * 8, y, 1, 1)
            })
         })
      }

      drawTimeIndicator()
   })

   return {
      open,
      wipe,
      restore,
      drawTimeRuler: () => {
         drawTimeIndicator()
      },
   }
}
