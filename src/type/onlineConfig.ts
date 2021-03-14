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
   periodNumber: number
   pixelPeriod: number
   // connection
   fail: boolean
   timeout: number
   targetList: string
   targetCount: number
   // page
   title: boolean
   connectedTitle: string
   disconnectedTitle: string
   // theme
   theme: string
   color: string
   themeObject: Theme
}
