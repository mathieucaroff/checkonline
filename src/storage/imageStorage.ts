import { day } from '../util/day'

export let createImageStorage = () => {
  let imageName = (time: Date) => `image${day(time)}`

  return {
    saveImage: (canvas: HTMLCanvasElement, time: Date) => {
      localStorage.setItem(imageName(time), canvas.toDataURL('image/png'))
    },
    loadImage: (time: Date) => {
      return localStorage.getItem(imageName(time))
    },
    loadImageFromDay: (dayName: string) => {
      return localStorage.getItem(`image${dayName}`)
    },
    removeImage: (time: Date) => {
      localStorage.removeItem(imageName(time))
    },
  }
}
