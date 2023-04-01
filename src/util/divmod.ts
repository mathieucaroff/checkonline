import { mod } from './mod'

export let divmod = (a: number, b: number) => {
  return [Math.floor(a / b), mod(a, b)]
}
