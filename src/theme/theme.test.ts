import { createExecutor, createReporter } from '../testlib/testlib'
import { colorObject, parseTheme, Theme } from './theme'

let parsetThemeExecutor = createExecutor(createReporter(console.log), parseTheme)

parseTheme({ theme: '', color: '' })

Object.entries(colorObject).forEach(([themeName, colorString]) => {
   let theme = {} as Theme
   colorString.split('==').map((pairString) => {
      let [name, value] = pairString.split('=')
      theme[name] = value
   })

   parsetThemeExecutor.case([{ color: colorString }], theme)
   parsetThemeExecutor.case([{ theme: themeName, color: '' }], theme)
})
parsetThemeExecutor.close()
