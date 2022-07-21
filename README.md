# pinia-misc

[![NPM version](https://img.shields.io/npm/v/pinia-misc?color=a1b858&label=)](https://www.npmjs.com/package/pinia-misc)

## Get started

```bash
pnpm i pinia-misc
```

## Usage

1. Setup plugin with your `createPinia` fn

```ts
import { createPinia } from 'pinia'
import { persistPlugin } from 'pinia-misc'

const pinia = createPinia()
pinia.use(persistPlugin)
```

2. Usage in pinia store

```ts
import { defineStore } from 'pinia'

const useTestStore = defineStore('counter', {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'foobar',
        flush: 'lazy',
      },
    ],
  },
  state: () => ({
    counter: 0,
  }),
  actions: {
    increment() {
      this.counter++
    },
    randomizeCounter() {
      this.counter = Math.round(100 * Math.random())
    },
  },
})
```

3. Typescript support (Optional)

```json
{
  "types": [
    "pinia-misc"
  ]
}
```

Then you can use `persist` option with type emits.

4. Persist options

```ts
type Flush = 'sync' | 'async' | 'lazy'

interface PersistStrategy {
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

interface PersistOptions {
  /**
   * Whether to persist the state on the client.
   */
  enabled: true
  /**
   * Custom strategies to persisting the state.
   */
  strategies?: PersistStrategy[]
}
```

## License

[MIT](./LICENSE) License © 2022 [guygubaby](https://github.com/bryce-loskie)
