import { OnlineConfig } from '../type/onlineConfig'

export interface PageProp {
   getConfig: () => OnlineConfig
   document: Document
}

export let createPage = ({ document, getConfig }: PageProp) => {
   let status: 'unknown' | 'connected' | 'disconnected' = 'unknown'

   let favicon = document.getElementById('favicon') as HTMLLinkElement
   let faviconConnected = document.getElementById('faviconConnected') as HTMLLinkElement
   let faviconDisconnected = document.getElementById('faviconDisconnected') as HTMLLinkElement

   return {
      markConnected: () => {
         if (status !== 'connected') {
            status = 'connected'
            favicon.href = faviconConnected.href
            document.title = getConfig().connectedTitle
            document.documentElement.style.backgroundColor = getConfig().themeObject.connected
         }
      },
      markOffline: () => {
         if (status !== 'disconnected') {
            status = 'disconnected'
            favicon.href = faviconDisconnected.href
            document.title = getConfig().disconnectedTitle
            document.documentElement.style.backgroundColor = getConfig().themeObject.disconnected
         }
      },
   }
}
