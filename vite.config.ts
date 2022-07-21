/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      all: true,
      include: [
        'src/**/*.ts',
      ],
      reporter: ['text', 'json', 'html'],
    },
  },
})
