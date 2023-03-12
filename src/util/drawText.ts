import fontImageUrl from '../../asset/typeface/pixelDigits.png'
import { Pair } from '../type'
import { loadImage } from './loadImage'

export let getDrawText = async () => {
  let font = await loadImage(fontImageUrl)

  return {
    drawText: (
      ctx: CanvasRenderingContext2D,
      position: Pair,
      text: string,
      backgroundColor: string,
    ) => {
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor
      }
      ctx.fillRect(position.x, position.y + 1, 6 * text.length + 1, 9)
      ;[...text].forEach((c, k) => {
        if (isNaN(parseInt(c, 10))) {
          return
        }
        let sx = 10 * +c
        let dx = 6 * k
        let w = 6
        let h = 10
        let { x, y } = position
        ctx.drawImage(font, sx, 0, w, h, x + dx + 1, y, w, h)
      })
    },
  }
}
