import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistStrategy } from '../src/index'
import { updateStorage } from '../src/index'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('updateStorage()', () => {
  let storage: Storage
  let store

  beforeEach(() => {
    storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    }

    store = {
      $id: 'my-id',
      $state: {
        firstname: 'foo',
        lastname: 'bar',
      },
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('custom storage', async () => {
    const strategy: PersistStrategy = {
      storage,
      flush: 'async',
    }

    updateStorage(strategy, store)

    await sleep(100)

    expect(storage.setItem).toHaveBeenCalledWith(
      'my-id',
      JSON.stringify(store.$state),
    )
  })

  it('custom key', () => {
    const strategy = {
      key: 'my-custom-key',
      storage,
    }

    updateStorage(strategy, store)

    expect(storage.setItem).toHaveBeenCalledWith(
      'my-custom-key',
      JSON.stringify(store.$state),
    )
  })

  it('custom paths', () => {
    const strategy = {
      storage,
      paths: ['firstname'],
    }

    updateStorage(strategy, store)

    expect(storage.setItem).toHaveBeenCalledWith(
      'my-id',
      JSON.stringify({ firstname: 'foo' }),
    )
  })

  it('default with sessionStorage', () => {
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
    })

    const strategy = {}

    updateStorage(strategy, store)

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'my-id',
      JSON.stringify(store.$state),
    )
  })
})
