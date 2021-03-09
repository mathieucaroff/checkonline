/**
 * Clock
 *
 * Produce a clock which tries to tick every **p** ms and accepts to skip ticks
 * if for some reason, it has run late. For each tick, it outputs the reached
 * target time. This time usually is the previous time incremeted by the period,
 * but it may be more if the clock has run late.
 * (because e.g. the page's JS was paused by the web browser)
 */

import { Observable } from 'rxjs'

/**
 * createObservableClock
 *
 * @param period time between two ticks in ms
 * @returns {Observable} the observable clock, paused until a .subscribe occures
 */
export let createObservableClock = (period: number) => {
   return new Observable<number>((subscriber) => {
      let timeoutId: NodeJS.Timeout
      let initialTime = Date.now()

      let tick = () => {
         let now = Date.now()
         let tickCount = Math.floor((now - initialTime) / period)
         let reachedTime = initialTime + tickCount * period
         let targetDelta = reachedTime + period - now
         subscriber.next(reachedTime)

         timeoutId = setTimeout(tick, targetDelta)
      }

      timeoutId = setTimeout(tick, 0)

      return () => {
         clearTimeout(timeoutId)
      }
   })
}
