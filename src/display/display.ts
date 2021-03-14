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
      let { pixelPeriod } = getConfig()

      pixelTime -= pixelTime % pixelPeriod
      let { x, y } = getHeadLocation(pixelTime)
      let [w, h] = divmod(pixelPeriod + 8 - 1, 8) // -1
      h += 1 // +1

      let theme = getConfig().themeObject
      ctx.fillStyle = theme.open
      ctx.fillRect(x, y, w, h)
      if (x % canvas.width <= 14) {
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

         Array.from({ length: 25 }, (_, k25) => {
            // hour labels
            let y = 8 * 4 * k25 // 8 pixels, 4 rows per hour
            drawer.drawText(ctx, { y, x: 0 }, ` ${k25}`.slice(-2), bg)

            // dots
            ctx.fillStyle = getConfig().themeObject.ruler
            Array.from({ length: 1920 / 2 / 5 }, (_, k192) => {
               ctx.fillRect(k192 * 5, y - 1, 1, 2)
            })
            Array.from({ length: 15 }, (_, k15) => {
               ctx.fillRect(k15 * 60, y - 5, 1, 10)
            })
         })
      }

      drawTimeIndicator()
   })

   return {
      open,
      wipe,
      restore,
      drawTimeIndicator: () => {
         drawTimeIndicator()
      },
   }
}
