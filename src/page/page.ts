import { OnlineConfig } from '../type/onlineConfig'

export interface PageProp {
   config: OnlineConfig
   document: Document
}

export let createPage = ({ document, config }: PageProp) => {
   let status: 'unknown' | 'connected' | 'disconnected' = 'unknown'

   let favicon = document.getElementById('favicon') as HTMLLinkElement
   let faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
   let faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

   return {
      markConnected: () => {
         if (status !== 'connected') {
            status = 'connected'
            favicon.href = faviconConnected.href
            document.title = config.connectedTitle
            document.documentElement.style.backgroundColor = config.connectedColor
         }
      },
      markOffline: () => {
         if (status !== 'disconnected') {
            status = 'disconnected'
            favicon.href = faviconDisconnected.href
            document.title = config.disconnectedTitle
            document.documentElement.style.backgroundColor = config.disconnectedColor
         }
      },
   }
}
