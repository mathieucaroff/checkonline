import { Subscription } from 'rxjs'
import { createObservableClock } from './clock/clock'
import { parseConfig } from './config'
import { pingTest } from './connection/connection'
import { createHorizontalDisplay } from './display/horizontal'
import { initPage } from './page/init'
import { createPage } from './page/page'
import { OnlineConfig } from './type/onlineConfig'
import { loadImage } from './util/loadImage'
import { urlRemoveParam } from './util/urlParam'

export let main = async () => {
   const setUpdateInterval = () => {
      clockSub.unsubscribe()
      clockSub = createObservableClock(config.periodNumber).subscribe((targetTime) => {
         let closer = display.open(targetTime)

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

   let config = parseConfig(location)

   // Initialize the page
   let { canvas } = initPage({ config, document, location, window })
   let page = createPage({ document, getConfig: () => config })

   let display = createHorizontalDisplay({ canvas, getConfig: () => config })

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

   runConfig(config, {} as any)

   const updateConfig = () => {
      let lastConfig: OnlineConfig = config
      config = parseConfig(location)
      runConfig(config, lastConfig)
   }

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
