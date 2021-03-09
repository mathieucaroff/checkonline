import { Theme } from '../theme/theme'

export interface OnlineConfig {
   // programmer
   debug: boolean
   // canvas
   clear: boolean
   width: number
   height: number
   // clock
   fast: boolean
   period: string
   // connection
   timeout: number
   targetList: string
   targetCount: number
   // page
   connectedTitle: string
   disconnectedTitle: string
   // theme
   theme: string
   color: string
   themeObject: Theme
}
