import { default as packageInfo } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { h } from '../lib/hyper'
import './style.css'
import '/node_modules/bootstrap/dist/css/bootstrap.min.css'

function drawarea() {
  return h('canvas', {
    className: 'drawarea',
    width: 900, // 15 * 60
    height: 768, // 8 * 24 * 4
  })
}

export function createPage() {
  const canvasLeft = drawarea()
  const canvasRight = drawarea()
  const content = h('div', {}, [
    h('i', { innerHTML: githubCornerHTML(packageInfo.repository) }),
    h('h1', { textContent: document.title }),
    h('div', {}, [canvasLeft, canvasRight]),
  ])

  return { canvasLeft, canvasRight, content }
}
