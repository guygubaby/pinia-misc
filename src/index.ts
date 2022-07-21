import type { PiniaPluginContext } from 'pinia'

export type Flush = 'sync' | 'async' | 'lazy'

export interface PersistStrategy {
  key?: string
  storage?: Storage
  paths?: string[]
  flush?: Flush
}

export interface PersistOptions {
  enabled: true
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

let isPending = false
const p = Promise.resolve()
let func: Fn = noop

const flushJob = () => {
  func()
  isPending = false
  func = noop
}

const persist = (flush: Flush, job: Fn) => {
  if (!isClient)
    return

  if (flush === 'sync')
    return job()

  func = job

  if (isPending)
    return

  isPending = true

  if (flush === 'async')
    return p.then(flushJob)

  window.addEventListener('beforeunload', flushJob, { once: true })
}

export const updateStorage = (strategy: PersistStrategy, store: Store) => {
  const storage = strategy.storage || sessionStorage
  const storeKey = strategy.key || store.$id
  const paths = strategy.paths
  const flush = strategy.flush || 'sync'

  let state: PartialState

  if (paths) {
    state = paths.reduce((finalObj, key) => {
      finalObj[key] = store.$state[key]
      return finalObj
    }, {} as PartialState)
  }
  else {
    state = store.$state
  }

  const fn = () => storage.setItem(storeKey, JSON.stringify(state))

  persist(flush, fn)
}

export default ({ options, store }: PiniaPluginContext): void => {
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
