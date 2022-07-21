/// <reference types="pinia-misc" />

import { defineStore } from 'pinia'

export const useTestStore = defineStore('test', {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'foobar',
        flush: 'sync',
        paths: 'counter',
      },
      {
        key: 'test',
        flush: 'async',
        paths: 'test',
      },
    ],
  },
  state: () => ({
    counter: 0,
    test: 'test',
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
