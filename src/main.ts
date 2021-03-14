import { Subscription } from 'rxjs'
import { createObservableClock } from './clock/clock'
import { parseConfig } from './config'
import { pingTest } from './connection/connection'
import { createDisplay } from './display/display'
import { initPage } from './page/init'
import { createPage } from './page/page'
import { createStorage } from './storage/storage'
import { OnlineConfig } from './type/onlineConfig'
import { loadImage } from './util/loadImage'
import { urlRemoveParam } from './util/urlParam'

export let main = async () => {
   let now = Date.now()
   let lastDay = now - (now % (86400 * 1000))

   const setUpdateInterval = () => {
      clockSub.unsubscribe()
      clockSub = createObservableClock(config.periodNumber).subscribe((targetTime) => {
         let localTime = targetTime + config.compoundOffset * 1000
         let day = localTime - (localTime % (86400 * 1000))
         if (day !== lastDay) {
            handleDayChange(lastDay)
            lastDay = day
         }
         let closer = displayLeft.open(localTime)

         pingTest(config, location)
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
   let { canvasLeft, canvasRight } = initPage({ config, document, window })
   let page = createPage({ document, getConfig: () => config })

   let storage = createStorage()

   let displayLeft = createDisplay({ canvas: canvasLeft, getConfig: () => config })
   let displayRight = createDisplay({ canvas: canvasRight, getConfig: () => config })

   // Initialize the configuration and make it auto-update the state
   let clockSub: Subscription = Subscription.EMPTY

   const runConfig = (config: OnlineConfig, lastConfig: OnlineConfig) => {
      if (config.clear) {
         localStorage.removeItem('image')
         displayLeft.wipe()
         displayLeft.drawTimeIndicator()
         urlRemoveParam(location, 'clear')
      }

      if (config.conditionalPeriod !== lastConfig.conditionalPeriod) {
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
   document.addEventListener('visibilitychange', updateConfig)

   // Restoring / Backing up the canvas image
   let imageDataUrl = storage.loadImage(new Date())
   if (imageDataUrl) {
      displayLeft.restore(await loadImage(imageDataUrl))
   } else {
      displayLeft.wipe() // make the canvas non-transparent and grey
   }

   window.addEventListener('beforeunload', () => {
      storage.saveImage(canvasLeft, new Date())
   })

   // handleDayChange
   let handleDayChange = (lastDay: number) => {
      storage.saveImage(canvasLeft, new Date(lastDay))
      console.log(`handledDayChange (${new Date(lastDay).toISOString()})`)
      displayLeft.wipe()
      displayLeft.drawTimeIndicator()
   }
}
