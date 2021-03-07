export let setAnimationFrame = (f: () => void | boolean) => {
   let g = () => {
      if (!f()) {
         requestAnimationFrame(g)
      }
   }
   requestAnimationFrame(g)
}
