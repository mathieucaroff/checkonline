import { day } from '../util/day'

export let createStorage = () => {
   let imageName = (time: Date) => `image${day(time)}`

   return {
      saveImage: (canvas: HTMLCanvasElement, time: Date) => {
         localStorage.setItem(imageName(time), canvas.toDataURL('image/png'))
      },
      loadImage: (time: Date) => {
         return localStorage.getItem(imageName(time))
      },
   }
}
