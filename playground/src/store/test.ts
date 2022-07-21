import { defineStore } from 'pinia'

export const useTestStore = defineStore('test', {
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
