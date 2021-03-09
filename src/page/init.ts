import { repository } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { OnlineConfig } from '../type/onlineConfig'
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

   return {
      canvas,
   }
}
