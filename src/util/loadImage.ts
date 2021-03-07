export function loadImage(url: string) {
   return new Promise<HTMLImageElement>((resolve) => {
      let image = new Image()
      image.onload = () => resolve(image)
      image.src = url
   })
}
