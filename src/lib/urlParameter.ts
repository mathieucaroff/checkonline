import { InfoObject, indirectResolve } from './indirectResolver'

export let ensureSpacelessURL = (location: Location) => {
  let spaceLessURL = location.href.replace(/ |%20/g, '')

  if (location.href !== spaceLessURL) {
    location.replace(spaceLessURL)
  }
}

let addHash = <T>(location: Location, infoObject: InfoObject<T>) => {
  // populate config with keys and key-value pairs from the URL
  location.hash
    .split('#')
    .slice(1)
    .forEach((piece: any) => {
      let key: keyof T
      let valueList: string[]
      let value: any
      if (piece.includes('=')) {
        ;[key, ...valueList] = piece.split('=')
        value = valueList.join('=')
        if (!isNaN(value)) {
          value = +value
        }
      } else {
        key = piece
        value = true
      }

      infoObject[key] = () => value
    })
}

export let resolveHash = <T>(location: Location, defaultConfig: InfoObject<T>) => {
  let infoObject = { ...defaultConfig }

  addHash(location, infoObject)

  return indirectResolve<T>(infoObject)
}

let addSearch = <T>(location: Location, infoObject: InfoObject<T>) => {
  let search = new URLSearchParams(location.search)

  ;[...(search.entries() as any)].forEach(([key, value]: [keyof T, any]) => {
    if (value === '') {
      value = true
    } else if (!isNaN(value)) {
      value = +value
    }
    infoObject[key] = () => value
  })
}

export let resolveSearch = <T>(location: Location, defaultConfig: InfoObject<T>) => {
  let infoObject = { ...defaultConfig }

  addSearch(location, infoObject)

  return indirectResolve<T>(infoObject)
}

export let resolveSearchAndHash = <T>(location: Location, defaultConfig: InfoObject<T>) => {
  let infoObject = { ...defaultConfig }

  addSearch(location, infoObject)
  addHash(location, infoObject)

  return indirectResolve<T>(infoObject)
}

export let urlRemoveSearchAndHashParam = (location: Location, param: string) => {
  const hashtagRegex__ = `#${param}(=[^#]*)?($|(#.*))`
  const searchRegex = `[?&]${param}(=[^&]*)?($|(&.*))`
  let newHref = location.href.replace(new RegExp(`${hashtagRegex__}|${searchRegex}`, 'g'), '$3$6')

  if (location.href !== newHref) {
    if (location.href.includes('#') && !newHref.includes('#')) {
      newHref += '#'
    }
    location.href = newHref
  }
}
