export let createKeyStorage = <T extends {}>(localStorage: Storage, baseName: string) => {
  const read = (): T => {
    try {
      return JSON.parse(localStorage.getItem(baseName) || '{}')
    } catch (e) {
      return {} as any
    }
  }

  const write = (current: T) => {
    localStorage.setItem(baseName, JSON.stringify(current, null, 2))
  }

  let current = read()

  return {
    clear: () => {
      current = {} as any
      write(current)
    },
    getItem: <TK extends keyof T>(key: TK): T[TK] => {
      return current[key]
    },
    removeItem: <TK extends keyof T>(key: TK) => {
      delete current[key]
      write(current)
    },
    setItem: <TK extends keyof T>(key: TK, value: T[TK]) => {
      current[key] = value
      write(current)
    },
  }
}

export interface KeyStorage<T extends {}> {
  clear: () => void
  getItem: <TK extends keyof T>(key: TK) => T[TK]
  removeItem: <TK extends keyof T>(key: TK) => void
  setItem: <TK extends keyof T>(key: TK, value: T[TK]) => void
}
