import { getContext2d } from '../util/getContext'
import { divmod } from '../util/divmod'
import { getDrawText } from '../util/drawText'
import { OnlineConfig } from '../type/onlineConfig'

let getHeadLocation = (p: number) => {
   let [a, esx] = divmod(p, 8 * 60) // eigth of seconds ~ x coordinate
   let [b, my] = divmod(a, 15) // minutes ~ y coordinate
   let [c, qh] = divmod(b, 4) // quarter hours (x coordinate)
   let [d, h] = divmod(c, 48) // hours (y coordinate)
   return { x: 8 * 60 * qh + esx, y: 15 * h + my }
}

interface DisplayProp {
   canvas: HTMLCanvasElement
   getConfig: () => OnlineConfig
}

export let createConvolutedDisplay = ({ canvas, getConfig }: DisplayProp) => {
   let { ctx } = getContext2d(canvas)

   const wipe = () => {
      ctx.fillStyle = getConfig().themeObject.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
   }

   const restore = (image: HTMLImageElement) => {
      ctx.drawImage(image, 0, 0)
   }

   // clockUpdate
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
         Array.from({ length: 2 }, (_, k2) => {
            Array.from({ length: 24 }, (_, k24) => {
               // hour labels
               let y = 15 * (k24 + 24 * k2)
               Array.from({ length: 4 }, (_, k4) => {
                  drawer.drawText(
                     ctx,
                     { y: y + 1, x: k4 * 480 },
                     ` ${k24}`.slice(-2),
                     getConfig().themeObject.textbg,
                  )
               })

               // dots
               ctx.fillStyle = getConfig().themeObject.ruler
               if (k24 % 2 === 0) {
                  Array.from({ length: 4 * (480 / 8) }, (_, k60) => {
                     ctx.fillRect(k60 * 8, y, 1, 1)
                  })
               }
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
