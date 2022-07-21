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
   * sync: persist immediately
   * async: persist after promise resolved
   * lazy: persist on window beforeunload
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

const noop = () => {}

const toArray = (paths: string | string[]) => {
  if (Array.isArray(paths))
    return paths
  return [paths]
}

let isPending = false
const p = Promise.resolve()
const fnMap = new Map<string, Fn>()

const flushJob = (storeKey: string) => {
  const func = fnMap.get(storeKey) || noop

  func()
  isPending = false

  fnMap.delete(storeKey)
}

const persist = (storeKey: string, flush: Flush, job: Fn) => {
  if (!isClient)
    return

  if (flush === 'sync')
    return job()

  fnMap.set(storeKey, job)

  if (isPending)
    return

  isPending = true

  if (flush === 'async')
    return p.then(() => flushJob(storeKey))

  window.addEventListener('beforeunload', () => flushJob(storeKey), { once: true })
}

export const updateStorage = (strategy: PersistStrategy, store: Store) => {
  const flush = strategy.flush || 'sync'
  const storage = strategy.storage || sessionStorage
  const storeKey = strategy.key || store.$id
  const paths = strategy.paths

  const fn = () => {
    let state: PartialState

    if (paths) {
      state = toArray(paths).reduce((finalObj, key) => {
        finalObj[key] = store.$state[key]
        return finalObj
      }, {} as PartialState)
    }
    else {
      state = store.$state
    }

    storage.setItem(storeKey, JSON.stringify(state))
  }

  persist(storeKey, flush, fn)
}

export const persistPlugin = ({ options, store }: PiniaPluginContext): void => {
  if (options.persist?.enabled) {
    const defaultStrategy: PersistStrategy[] = [{
      key: store.$id,
      storage: sessionStorage,
      flush: 'sync',
    }]

    const strategies = options.persist?.strategies?.length ? options.persist?.strategies : defaultStrategy

    strategies.forEach((strategy) => {
      const storage = strategy.storage || sessionStorage
      const storeKey = strategy.key || store.$id
      const storageResult = storage.getItem(storeKey)

      if (storageResult) {
        store.$patch(JSON.parse(storageResult))
        updateStorage(strategy, store)
      }
    })

    store.$subscribe(() => {
      strategies.forEach((strategy) => {
        updateStorage(strategy, store)
      })
    })
  }
}
