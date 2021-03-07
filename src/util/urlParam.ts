export type DefaultConfigObject<T> = {
   [K in keyof T]: (param: Indirect<T>) => T[K]
}

export type Indirect<T> = {
   [K in keyof T]: () => T[K]
}

export let spacelessUrl = (location: Location) => {
   let spaceLessURL = location.href.replace(/ |%20/g, '')

   if (spaceLessURL.includes(' ')) throw new Error()

   if (location.href !== spaceLessURL) {
      location.replace(spaceLessURL)
   }

   if (location.href.includes(' ')) throw new Error()
}

export let urlRemoveParam = (location: Location, param: string) => {
   let newHref = location.href.replace(new RegExp(`#${param}(=[^#]*)?`), '')

   if (location.href !== newHref) {
      location.href = newHref
   }
}

export let getUrlParam = <T>(location: Location, defaultConfig: DefaultConfigObject<T>) => {
   let config: T = {} as any

   // get and split the parameter string
   let pieceList = location.hash.split('#').slice(1)

   // process the parameter string into the config object to get the user-defined config
   pieceList.forEach((piece) => {
      let key: string
      let valueList: string[]
      let value
      if (piece.includes('=')) {
         ;[key, ...valueList] = piece.split('=')
         value = valueList.join('=')
         if (!isNaN(value)) {
            value = +value
         }
      } else {
         key = piece
         value = true
      }

      config[key] = value
   })

   // build the stacked config object, which handles dependency resolution
   let stackedConfig = {} as Indirect<T>
   Object.keys(defaultConfig).forEach((key) => {
      stackedConfig[key] = () => {
         if (!(key in config)) {
            config[key] = defaultConfig[key](stackedConfig)
         }
         return config[key]
      }
   })

   Object.keys(defaultConfig).forEach((key) => {
      if (!(key in config)) {
         config[key] = defaultConfig[key](stackedConfig)
      }
   })

   return config
}
