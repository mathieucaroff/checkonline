import { mod } from './mod'

export let divmod = (a: number, b: number) => {
   return [~~(a / b), mod(a, b)]
}
