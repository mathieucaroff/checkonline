export interface ThemeConfig {
   theme?: string
   color: string
}

/**
 * A few sets of colors
 *
 * disconnected -> background color while disconnected
 * connected -> background color while connected
 * background -> canvas background color
 * ruler -> color for the ruler dots
 * open -> color for a dash waiting for the network response
 * success -> color for dash after a successful of its request
 * failure -> color for dash after a failure of its request
 */
export let colorObject = {
   semantic: [
      'disconnected=#f77',
      'connected=#000',
      'background=#111',
      'ruler=#ccc',
      'textbg=#ccc',
      'open=#DD2',
      'success=#5c5',
      'failure=#e55',
   ].join('=='),
   dark: [
      'disconnected=#fff',
      'connected=#000',
      'background=#111',
      'ruler=#ccc',
      'textbg=#ccc',
      'open=#777',
      'success=#444',
      'failure=#eee',
   ].join('=='),
   light: [
      'disconnected=#000',
      'connected=#ddd',
      'background=#eee',
      'ruler=#000',
      'textbg=#fff',
      'open=#777',
      'success=#ccc',
      'failure=#222',
   ].join('=='),
}

export interface Theme {
   disconnected: string
   connected: string

   background: string
   ruler: string
   textbg: string
   open: string

   success: string
   failure: string
}

export let nameList: (keyof Theme)[] = [
   'disconnected',
   'connected',
   'background',
   'ruler',
   'textbg',
   'open',
   'success',
   'failure',
]

export let nameMap: Record<string, string> = {}

nameList.forEach((name) => {
   nameMap[name] = name
   nameMap[name[0]] = name
})

export let parseTheme = (config: ThemeConfig) => {
   let theme = {} as Theme

   if (config.theme) {
      theme = parseTheme({ color: colorObject[config.theme] || colorObject.semantic })
   }

   if (config.color.length === 0) {
      return theme
   }

   let pieceList = config.color.split(/==\b/) // the name cannot be empty but the value can

   pieceList.forEach((piece) => {
      let nameValue = piece.split('=')
      if (nameValue.length < 2) {
         return // skip
      }
      theme[nameMap[nameValue[0]]] = nameValue.slice(1).join('=')
   })

   return theme
}
