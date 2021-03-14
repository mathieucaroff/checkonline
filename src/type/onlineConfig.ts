import { Theme } from '../theme/theme'

export interface OnlineConfig {
   // programmer
   debug: boolean
   // canvas
   clear: boolean
   // clock
   fast: boolean
   conditionalPeriod: string // period with the tab is visible, slowPeriod otherwise
   period: string // visible period
   slowPeriod: string // non visible period
   periodNumber: number
   pixelPeriod: number
   timezone: number
   timeoffset: number
   compoundOffset: number
   // connection
   fail: boolean
   timeout: number
   targetList: string
   targetCount: number
   // page
   title: boolean
   connectedTitle: string
   disconnectedTitle: string
   // rightside canvas
   right: string
   // theme
   theme: string
   color: string
   themeObject: Theme
}
