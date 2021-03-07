import { Observable } from 'rxjs'

/**
 * NoisyState
 *
 * A state atom that can be observed
 */
export interface NoisyState<T> {
   /**
    * read
    *
    * obtain the content of the atom
    */
   read(): T
   /**
    * write
    *
    * update the content of the atom
    *
    * @param value the new value
    */
   write(value: T): void
   /**
    * subscribe
    *
    * Will receive any new value written to the state. Note: the
    * internal value, returned by `.read()`, is updated before the
    * subscribers are woken up. This ensures the coherence between the
    * provided value and the value of `.read()`.
    */
   subscribe(subscriber: (value: T) => void): void
   /**
    * attach
    *
    * Like subscribe, but the callback function will be run once before
    * the method returns.
    */
   attach(subscriber: (value: T) => void): void
   /**
    * disposeAll
    *
    * Remove all subscribers
    */
   disposeAll(): void
}

/**
 * createNoisyState
 *
 * Create a NoisyState, with the given state as initial value.
 *
 * @param state the inital value
 */
export let createNoisyState = <T>(state: T) => {
   let subscriberList: ((value: T) => void)[] = []

   let me: NoisyState<T> = {
      read() {
         return state
      },
      write(value: T) {
         state = value

         subscriberList.forEach((subscriber) => {
            subscriber(value)
         })
      },
      subscribe(subscriber) {
         subscriberList.push(subscriber)

         return () => {
            let index = subscriberList.indexOf(subscriber)
            if (index > -1) {
               subscriberList.splice(index, 1)
            }
         }
      },
      attach(subscriber) {
         subscriber(state)
         me.subscribe(subscriber)
      },
      disposeAll() {
         subscriberList.splice(0, subscriberList.length)
      },
   }

   return me
}

/**
 * createNoisyStateWithObservable
 *
 * Great if the target noisyState value can easily be obtained by a function.
 * The refresh signal is taken from an observable.
 *
 * @param observable observable, used as a scheduler
 * @param getter The function run each time the observable fires, to
 * produce the new value of the NoisyState
 */
export let createNoisyStateWithObservable = (observable: Observable<any>) => <T>(
   getter: () => T,
) => {
   let me = createNoisyState(getter())

   observable.subscribe(() => me.write(getter()))

   return me
}
