import { Subscription } from 'rxjs'
import { createObservableClock } from './clock/clock'
import { getConfig } from './config'
import { pingTest } from './connection/connection'
import { createConvolutedDisplay } from './display/display'
import { initPage } from './page/init'
import { createPage } from './page/page'
import { OnlineConfig } from './type/onlineConfig'
import { loadImage } from './util/loadImage'
import { parseTimeToMs } from './util/parseTimeToMs'
import { urlRemoveParam } from './util/urlParam'

export let main = async () => {
   const setUpdateInterval = () => {
      clockSub.unsubscribe()
      clockSub = createObservableClock(parseTimeToMs(config.period)).subscribe((targetTime) => {
         let closer = display.update(targetTime)

         pingTest(config.targetList.split('=='), config.timeout)
            .then(() => {
               page.markConnected()
               closer.closeSuccess()
            })
            .catch(() => {
               page.markOffline()
               closer.closeError()
            })
      })
   }

   // Initialize the configuration and make it auto-update the state
   let clockSub: Subscription = Subscription.EMPTY

   const runConfig = (config: OnlineConfig, lastConfig: OnlineConfig) => {
      if (config.clear) {
         localStorage.removeItem('image')
         display.wipe()
         display.drawTimeRuler()
         urlRemoveParam(location, 'clear')
      }

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

   let config = getConfig(location)

   // Initialize the page
   let { canvas } = initPage({ config, document, location, window })
   let page = createPage({ config, document })

   let display = createConvolutedDisplay({ canvas, getConfig: () => config })

   runConfig(config, {} as any)
   window.addEventListener('hashchange', updateConfig)

   // Restoring / Backing up the canvas image
   let imageDataUrl = localStorage.getItem('image')
   if (imageDataUrl) {
      display.restore(await loadImage(imageDataUrl))
   } else {
      display.wipe() // make the canvas non-transparent and grey
   }

   window.addEventListener('beforeunload', () => {
      localStorage.setItem('image', canvas.toDataURL('image/png'))
   })
}
