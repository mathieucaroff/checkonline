export let deepEqual = <T>(a: T, b: T) => {
   if (a === b) {
      return true
   }
   if (typeof a !== typeof b) {
      return false
   }
   if (typeof a === 'object') {
      let ka = Object.keys(a)
      let kb = Object.keys(b)
      if (ka.length !== kb.length) {
         return false
      }
      for (let k = 0; k < ka.length; k++) {
         let key = ka[k]
         if (!kb.includes(key) || !deepEqual(a[key], b[key])) {
            return false
         }
      }
      return true
   }
   return false
}
