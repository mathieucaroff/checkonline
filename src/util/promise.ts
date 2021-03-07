// delayName :: (k, Promise a) -> Promise (k, a)
let delayName = ([name, promise]) => promise.then((result) => [name, result])

export type PromiseValues<TO> = {
   [TK in keyof TO]: Promise<TO[TK]>
}

// promiseObjectAll :: {k: Promise a} -> Promise {k: a}
export let promiseObjectAll = <T>(object: PromiseValues<T>): Promise<T> => {
   let promiseList = Object.entries(object).map(delayName)
   return Promise.all(promiseList).then(Object.fromEntries)
}
