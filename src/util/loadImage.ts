export function loadImage(url: string) {
   return new Promise<HTMLImageElement>((resolve, reject) => {
      let image = new Image()
      image.onload = () => resolve(image)
      image.onerror = (event, source, lineno, colno, error) => reject(error ?? event)
      image.src = url
   })
}
