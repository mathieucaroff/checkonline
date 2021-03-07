import { interval, Subscription } from 'rxjs'
import { getConfig } from './config'
import { pingTest } from './corelib/connection'
import { initPage } from './page/init'
import { OnlineConfig } from './type/onlineConfig'
import { divmod } from './util/divmod'
import { getDrawText } from './util/drawText'
import { getContext2d } from './util/getContext'
import { loadImage } from './util/loadImage'
import { mod } from './util/mod'
import { parseTimeToMs } from './util/parseTimeToMs'
import { urlRemoveParam } from './util/urlParam'

let getHeadLocation = (p: number) => {
   let [a, esx] = divmod(p, 8 * 60) // eigth of seconds ~ x coordinate
   let [b, my] = divmod(a, 15) // minutes ~ y coordinate
   let [c, qh] = divmod(b, 4) // quarter hours (x coordinate)
   let [d, h] = divmod(c, 48) // hours (y coordinate)
   return { x: 8 * 60 * qh + esx, y: 15 * h + my }
}

export let main = async () => {
   // clockUpdate
   let drawTimeRuler = () => {}
   const update = (k) => {
      let { x, y } = getHeadLocation(now + k * config.drawSpeed)
      let d = config.drawSpeed
      ctx.fillStyle = '#707070'
      ctx.fillRect(x, y, d, 1)
      if (config.debug || x % 480 <= 2 * d) {
         drawTimeRuler()
      }

      pingTest(config.targetList.split('=='))
         .then(() => {
            ctx.fillStyle = '#404040'
            ctx.fillRect(x, y, d, 1)
         })
         .catch(() => {
            ctx.fillStyle = '#F0F0F0'
            ctx.fillRect(x, y, d, 1)
         })
   }

   const wipe = () => {
      ctx.fillStyle = '#101010'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
   }

   const setUpdateInterval = () => {
      clockSub.unsubscribe()
      clockSub = interval(parseTimeToMs(config.period)).subscribe(update)
   }

   // Initialize the configuration and make it auto-update the state

   let config: OnlineConfig

   let clockSub: Subscription = Subscription.EMPTY

   const runConfig = (config: OnlineConfig, lastConfig: OnlineConfig) => {
      if (config.clear) {
         localStorage.removeItem('image')
         wipe()
         drawTimeRuler()
         urlRemoveParam(location, 'clear')
      }

      now = getNow()
      if (config.period !== lastConfig.period) {
         // (Re)-Start ticking
         setUpdateInterval()
      }
   }

   const updateConfig = () => {
      let lastConfig: OnlineConfig = config
      config = getConfig(location)
      runConfig(config, lastConfig)
   }

   config = getConfig(location)

   const getNow = () => {
      let now8 = ~~mod((Date.now() * 8) / 1000, 2 * 24 * 60 * 60 * 8)
      let nowAligned = now8 - mod(now8, config.drawSpeed)
      return nowAligned
   }
   let now = getNow()

   console.log('now', now, 'es;', now / 8, 's')

   // Initialize the page
   let { canvas, screenSize } = initPage({ config, document, location, window })

   let { ctx } = getContext2d(canvas)

   runConfig(config, {} as any)
   window.addEventListener('hashchange', updateConfig)

   // Restoring / Backing up the canvas image
   let imageDataUrl = localStorage.getItem('image')
   if (imageDataUrl) {
      ctx.drawImage(await loadImage(imageDataUrl), 0, 0)
   } else {
      wipe()
   }

   window.addEventListener('beforeunload', () => {
      localStorage.setItem('image', canvas.toDataURL('image/png'))
   })

   // Rulers and indications
   getDrawText().then((drawer) => {
      drawTimeRuler = () => {
         Array.from({ length: 2 }, (_, k2) => {
            Array.from({ length: 24 }, (_, k24) => {
               let y = 15 * (k24 + 24 * k2)
               Array.from({ length: 4 }, (_, k4) => {
                  drawer.drawText(ctx, { y: y + 1, x: k4 * 480 }, ` ${k24 + 1}`.slice(-2))
               })
               if (k24 % 2 === 0) {
                  ctx.fillStyle = '#C0C0C0'
                  Array.from({ length: 4 * (480 / 8) }, (_, k60) => {
                     ctx.fillRect(k60 * 8, y, 1, 1)
                  })
               }
            })
         })
      }

      drawTimeRuler()
   })
}
