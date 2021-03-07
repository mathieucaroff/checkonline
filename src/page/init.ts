import { config, fromEvent } from 'rxjs'
import { repository } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { Pair } from '../type/pair'
import { OnlineConfig } from '../type/onlineConfig'
import { createNoisyStateWithObservable } from '../util/noisyState'
import { h } from '../lib/hyper'

interface InitProp {
   config: OnlineConfig
   document: Document
   location: Location
   window: Window
}

export let initPage = (prop: InitProp) => {
   let { config, document, window } = prop

   let canvas = h('canvas', {
      width: config.width,
      height: config.height,
   })

   let corner = h('i', {
      innerHTML: githubCornerHTML(repository),
   })

   document.body.append(
      h('h1', {
         textContent: document.title,
         className: 'inline',
      }),
      h('div', {}, [canvas]),
      corner,
   )

   let screenSize = createNoisyStateWithObservable(fromEvent(window, 'resize'))(
      (): Pair => ({
         y: window.innerHeight,
         x: window.innerWidth,
      }),
   )

   return {
      canvas,
      screenSize,
   }
}
