type PendingRequest = {
  controller: AbortController
  promise: Promise<unknown>
  subscribers: number
  settled: boolean
}

const pendingRequests = new Map<string, PendingRequest>()

export const acquirePagedListRequest = <T>(key: string, load: (signal: AbortSignal) => Promise<T>) => {
  let request = pendingRequests.get(key)
  if (!request) {
    const controller = new AbortController()
    request = {
      controller,
      promise: Promise.resolve().then(() => {
        if (current.subscribers === 0) controller.abort()
        controller.signal.throwIfAborted()
        return load(controller.signal)
      }),
      subscribers: 0,
      settled: false,
    }
    pendingRequests.set(key, request)
    const current = request
    const finish = () => {
      current.settled = true
      if (pendingRequests.get(key) === current) pendingRequests.delete(key)
    }
    void current.promise.then(finish, finish)
  }

  const current = request
  current.subscribers += 1
  let released = false

  return {
    promise: current.promise as Promise<T>,
    release: () => {
      if (released) return
      released = true
      current.subscribers -= 1
      // Effect replay can reclaim the same request before its last subscriber leaves.
      queueMicrotask(() => {
        if (current.subscribers !== 0 || current.settled) return
        if (pendingRequests.get(key) === current) pendingRequests.delete(key)
        current.controller.abort()
      })
    },
  }
}
