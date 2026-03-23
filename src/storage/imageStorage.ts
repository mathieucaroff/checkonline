import { day } from '../util/time'

export let createImageStorage = () => {
  let imageName = (time: Date) => `image${day(time)}`

  return {
    saveImage: (canvas: HTMLCanvasElement, time: Date) => {
      // Keep at most 7 images in localStorage; the 7 most recent ones.
      // This avoids localStorage filling up and stopping to save new images.
      let imageList = Object.keys(localStorage).filter((key) => key.startsWith('image'))
      if (imageList.length >= 7) {
        for (let key of imageList.sort().slice(0, -6)) {
          localStorage.removeItem(key)
        }
      }

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
