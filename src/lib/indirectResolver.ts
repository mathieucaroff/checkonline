export type InfoObject<T> = {
  [K in keyof T]: (param: Indirect<T>) => T[K]
}

export type Indirect<T> = {
  [K in keyof T]: () => T[K]
}

let keys = <T>(input: T): (keyof T)[] => Object.keys(input as any) as any

export let indirectResolve = <T>(info: InfoObject<T>): T => {
  let result: T = {} as any

  let resolver: Indirect<T> = {} as any

  keys(info).forEach((key) => {
    resolver[key] = () => {
      let value = info[key](resolver)
      resolver[key] = () => value
      return value
    }
  })

  keys(info).forEach((key) => {
    result[key] = resolver[key]()
  })

  return result
}
