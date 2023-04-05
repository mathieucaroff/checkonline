import { BROADCAST_CHANNEL_NAME, PUNCTUALITY_FACTOR, TARGET_LIST } from '../constant'
import { ConnectivityOrder, Message } from '../type'
import { createBroadcastChannel } from '../util/channel'
import { createClock } from './clock/clock'
import { createPingTester } from './connectivity/connectivity'
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope & typeof globalThis

// self.addEventListener('install', () => {
const wbManifest = (self as any).__WB_MANIFEST
if (wbManifest) {
  precacheAndRoute(wbManifest)
}
// })

const config = {
  period: 500,
  reactivity: 500,
}

const checkonlineChannel = createBroadcastChannel<Message>(BROADCAST_CHANNEL_NAME)

const pingTester = createPingTester(self, TARGET_LIST)

const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000

const punctualityThreshold = config.period * PUNCTUALITY_FACTOR
const clock = createClock(
  config.period,
  timezoneOffset,
  punctualityThreshold,
  (time, duration, skip) => {
    const post = (type: ConnectivityOrder['type']) => {
      checkonlineChannel.postMessage({ type, time, duration })
    }

    if (skip) {
      post('cancel')
      return
    }

    post('open')

    pingTester.test(config.reactivity).then(
      () => post('success'),
      () => post('failure'),
    )
  },
)

checkonlineChannel.addMessageEventListener(({ data }) => {
  if (data.type === 'config') {
    if (data.period) {
      clock.setPeriod(data.period)
      clock.setPunctualityThreshold(data.period * PUNCTUALITY_FACTOR)
    }
    if (data.reactivity) {
      config.reactivity = data.reactivity
    }
  }
})
