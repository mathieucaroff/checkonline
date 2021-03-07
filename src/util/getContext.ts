export let getContext2d = (canvas: HTMLCanvasElement) => {
   let ctx = canvas.getContext('2d')
   if (ctx === null) {
      throw new Error()
   }
   return { ctx }
}

export let getContextWebGl2 = (canvas: HTMLCanvasElement) => {
   let gl = canvas.getContext('webgl2')
   if (gl === null) {
      throw new Error()
   }
   return { gl }
}
