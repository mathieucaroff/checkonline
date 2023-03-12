// function create()
// from
// https://github.com/mathieucaroff/xadom/blob/37570300c7/src/util/xaUtil.ts

/**
 * deepUpdate -- beware it will loop infintely and crash the process by
 * running out of memory if given cyclic references.
 *
 * @param destination the object that will be written to
 * @param source the object whose data will be read and copied
 */
function deepUpdate(destination: any, source: any) {
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      if (typeof destination[key] !== 'object' || destination[key] === null) {
        destination[key] = {}
      }
      deepUpdate(destination[key], value)
    } else {
      destination[key] = value
    }
  })
}

/**
 * create an HTML Element
 *
 * @param name The html name of the element to create
 * @param attribute An object associating keys to values for the created element
 * @param children An array of children elements
 */
function h<K extends keyof HTMLElementTagNameMap>(
  name: K,
  attribute?: Partial<HTMLElementTagNameMap[K]> & Record<string, any>,
  children?: Element[],
): HTMLElementTagNameMap[K]

function h<K extends keyof HTMLElementTagNameMap>(
  name: K,
  attribute?: Record<string, any>,
  children?: Element[],
): HTMLElementTagNameMap[K]

function h<T extends Element = HTMLElement>(
  name: string,
  attribute?: Record<string, any>,
  children?: Element[],
): T

function h<K extends keyof HTMLElementTagNameMap>(
  name: K,
  attribute: Partial<HTMLElementTagNameMap[K]> & Record<string, any> = {},
  children: Element[] = [],
) {
  let elem: any = document.createElement<K>(name)

  Object.entries(attribute).forEach(([name, value]) => {
    if (elem[name] === undefined) {
      elem.setAttribute(name, value)
    } else if (typeof elem[name] === 'object' && elem[name] !== null) {
      deepUpdate(elem[name], value)
    } else {
      elem[name] = value
    }
  })

  children.forEach((child) => {
    elem.appendChild(child)
  })

  return elem
}

export { h }
