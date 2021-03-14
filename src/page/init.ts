import { repository } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { OnlineConfig } from '../type/onlineConfig'
import { h } from '../lib/hyper'

interface InitProp {
   config: OnlineConfig
   document: Document
   window: Window
}

export let initPage = (prop: InitProp) => {
   let { document } = prop

   let canvasLeft = h('canvas', {
      width: 900, // 15 * 60
      height: 768, // 8 * 24 * 4
   })
   let canvasRight = h('canvas', {
      width: 900,
      height: 720,
      style: {
         display: 'none',
      },
   })

   let corner = h('i', {
      innerHTML: githubCornerHTML(repository),
   })

   document.body.append(
      h('h1', {
         textContent: document.title,
         className: 'inline',
      }),
      h('div', {}, [canvasLeft, canvasRight]),
      corner,
   )

   return {
      canvasLeft,
      canvasRight,
   }
}
