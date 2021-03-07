export type Entries<T> = {
   [K in keyof T]: [K, T[K]]
}[keyof T][]

export let entries = <T>(input: T) => {
   return Object.entries(input) as Entries<T>
}
