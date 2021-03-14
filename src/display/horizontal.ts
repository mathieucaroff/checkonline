import { getContext2d } from '../util/getContext'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { OnlineConfig } from '../type/onlineConfig'

let getHeadLocation = (p: number) => {
   let [u, es] = divmod(p, 8 * 60 * 2) // eigth of seconds ~ x coordinate
   let [v, hm] = divmod(u, 30) // half-minutes ~ y coordinate
   let [w, h] = divmod(v, 24) // hours (y coordinate)
   let [z, d] = divmod(w, 2) // day (x coordinate too)
   return { x: 8 * 60 * 2 * d + es, y: 30 * h + hm }
}

interface DisplayProp {
   canvas: HTMLCanvasElement
   getConfig: () => OnlineConfig
}

export let createHorizontalDisplay = ({ canvas, getConfig }: DisplayProp) => {
   let { ctx } = getContext2d(canvas)

   const wipe = () => {
      ctx.fillStyle = getConfig().themeObject.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
   }

   const restore = (image: HTMLImageElement) => {
      ctx.drawImage(image, 0, 0)
   }

   const open = (targetTime: number) => {
      let pixelTime = (8 * targetTime) / 1000
      let d = getConfig().pixelPeriod
      pixelTime -= pixelTime % d
      let { x, y } = getHeadLocation(pixelTime)

      let theme = getConfig().themeObject
      ctx.fillStyle = theme.open
      ctx.fillRect(x, y, d, 1)
      if (getConfig().debug || x % 480 <= 2 * d) {
         drawTimeIndicator()
      }

      return {
         closeSuccess: () => {
            ctx.fillStyle = theme.success
            ctx.fillRect(x, y, d, 1)
         },
         closeError: () => {
            ctx.fillStyle = theme.failure
            ctx.fillRect(x, y, d, 1)
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
            let y = 30 * k24
            Array.from({ length: 2 }, (_, k2) => {
               drawer.drawText(ctx, { y, x: k2 * 960 }, ` ${k24}`.slice(-2), bg)
            })

            // dots
            ctx.fillStyle = getConfig().themeObject.ruler
            Array.from({ length: 1920 / 8 }, (_, k240) => {
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
