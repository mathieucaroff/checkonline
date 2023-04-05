/**
 * Test whether internet is available by loading an image
 */

/**
 * pingTest checks the internet connection status by querying the provided urls.
 *
 * @param self Object which contains the setTimeout and clearTimeout methods
 * @param targetList List of image urls to query. These urls must not have any query string nor hash. All the urls will be queried simultaneously.
 * @param reactivity The time to wait for a response from the queried websites.
 * @returns A promise which resolves to the index of the first url of the targetList to respond or errors
 */
export function pingTest(self: typeof globalThis, targetList: string[], reactivity: number) {
  let startTime = new Date().getTime()

  return new Promise<number>((resolve, reject) => {
    let errorTimeoutId = self.setTimeout(() => {
      reject('timeout')
    }, reactivity)

    targetList.forEach((imageUrl, k) => {
      self.fetch(`${imageUrl}?t=${startTime}`, { mode: 'no-cors' }).then((response) => {
        if (response.status >= 400) {
          console.error(response)
          return
        }

        self.clearTimeout(errorTimeoutId)
        resolve(k)
      })
    })
  })
}

/**
 * createPingTester
 *
 * @param self Object which contains the setTimeout and clearTimeout methods
 * @param baseTargetList List of image urls to query. The first url will be queried first. The remaining urls will be queried if the first fails to respond in time.
 * @returns A slow ping tester oject
 */
export function createPingTester(self: typeof globalThis, baseTargetList: string[]) {
  if (baseTargetList.length < 1) {
    throw new Error('empty targetList')
  }

  const targetList = Array.from(baseTargetList)
  let defaultTargetIndex = 0
  let status: 'online' | 'offline' = 'offline'

  return {
    /**
     * @param reactivity The time the tester waits for the ping responses before declaring a failure.
     * @returns a promise which succeeds when online and rejects when offline
     */
    test: (reactivity: number): Promise<void> => {
      if (status === 'offline') {
        // if offline, target all the urls and picks the first one to answer,
        // or let the timeout signal that the connection is still broken.
        return pingTest(self, targetList, reactivity).then((firstAnswerIndex) => {
          defaultTargetIndex = firstAnswerIndex
          status = 'online'
        })
      }

      // if online, target the url which was the fastest to answer initially.
      // if a timeout happens, catch it to set the internal state as offline,
      // then throw it again so as to signal that the connection is broken.
      return pingTest(self, [targetList[defaultTargetIndex]], reactivity).then(
        null,
        (error: string) => {
          status = 'offline'
          throw error
        },
      )
    },
  }
}
