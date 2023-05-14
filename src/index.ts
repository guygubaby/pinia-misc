import type { PiniaPluginContext } from 'pinia'

export type Flush = 'sync' | 'async' | 'lazy'

export interface PersistStrategy {
  /**
   * Persist key, if not set will use store id instead
   */
  key?: string
  /**
   * Storage to use, if not set will use sessionStorage
   */
  storage?: Storage
  /**
   * Paths to persist, if not set will persist all, can be string or array
   */
  paths?: string[] | string
  /**
   * Flush strategy, if not set will use 'sync', the others two are 'async' and 'lazy', which can be used for better performance
   *
   * `sync`: persist immediately
   *
   * `async`: persist using task queue
   *
   * `lazy`: persist using window beforeunload event
   */
  flush?: Flush
}

export interface PersistOptions {
  /**
   * Whether to persist the state on the client.
   */
  enabled: true
  /**
   * Custom strategies to persisting the state.
   */
  strategies?: PersistStrategy[]
}

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: PersistOptions
  }
}

type Fn = () => void

const isClient = typeof window !== 'undefined'

const toArray = (paths: string | string[]) => {
  if (Array.isArray(paths)) return paths
  return [paths]
}

const runAll = (jobs: Fn[]) => {
  try {
    jobs.forEach((job) => job())
  } catch (error) {
    // pass
  }
}

let asyncJobsTimerId: ReturnType<typeof setTimeout> | undefined = undefined
const asyncJobMap = new Map<string, Fn>()

const queueAsyncJob = (key: string, job: Fn) => {
  asyncJobMap.set(key, job)

  if (asyncJobsTimerId) return

  asyncJobsTimerId = setTimeout(() => {
    const jobs = [...asyncJobMap.values()]
    asyncJobMap.clear()
    runAll(jobs)
    clearTimeout(asyncJobsTimerId)
    asyncJobsTimerId = undefined
  }, 0)
}

let isLazyJobsRegisted = false
const lazyJobMap = new Map<string, Fn>()

const queueLazyJob = (key: string, job: Fn) => {
  lazyJobMap.set(key, job)

  if (isLazyJobsRegisted) return

  isLazyJobsRegisted = true

  window.addEventListener(
    'beforeunload',
    () => {
      runAll([...lazyJobMap.values()])
      lazyJobMap.clear()
      isLazyJobsRegisted = false
    },
    { once: true }
  )
}

const persist = (key: string, flush: Flush, job: Fn) => {
  if (!isClient) return

  if (flush === 'sync') return job()

  const fn = flush === 'async' ? queueAsyncJob : queueLazyJob
  fn(key, job)
}

export const updateStorage = (strategy: PersistStrategy, store: Store) => {
  const flush = strategy.flush || 'sync'
  const storeKey = strategy.key || store.$id

  const fn = () => {
    const storage = strategy.storage || sessionStorage
    const paths = strategy.paths

    let state: PartialState

    if (paths) {
      state = toArray(paths).reduce((finalObj, key) => {
        finalObj[key] = store.$state[key]
        return finalObj
      }, {} as PartialState)
    } else {
      state = store.$state
    }

    try {
      storage.setItem(storeKey, JSON.stringify(state))
    } catch (error: any) {
      throw new Error('Failed to persist state to storage:', error)
    }
  }

  persist(storeKey, flush, fn)
}

export const persistPlugin = ({ options, store }: PiniaPluginContext): void => {
  if (!options.persist?.enabled) return

  const defaultStrategy: PersistStrategy[] = [
    {
      key: store.$id,
      storage: sessionStorage,
      flush: 'sync',
    },
  ]

  const strategies = options.persist?.strategies?.length ? options.persist?.strategies : defaultStrategy

  strategies.forEach((strategy) => {
    const storage = strategy.storage || sessionStorage
    const storeKey = strategy.key || store.$id
    const storageResult = storage.getItem(storeKey)

    if (storageResult) {
      try {
        store.$patch(JSON.parse(storageResult))
        updateStorage(strategy, store)
      } catch (error: any) {
        throw new Error('Failed to restore state from storage:', error)
      }
    }
  })

  store.$subscribe(() => {
    strategies.forEach((strategy) => {
      updateStorage(strategy, store)
    })
  })
}
