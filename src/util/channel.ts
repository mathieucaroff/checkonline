export function createBroadcastChannel<T>(name: string) {
  const checkonlineChannel = new BroadcastChannel(name)

  return {
    addMessageEventListener: (listener: (event: { data: T }) => void) =>
      checkonlineChannel.addEventListener('message', listener),
    postMessage: (message: T) => {
      checkonlineChannel.postMessage(message)
    },
  }
}

export type COBroadcastChannel<T> = ReturnType<typeof createBroadcastChannel<T>>
