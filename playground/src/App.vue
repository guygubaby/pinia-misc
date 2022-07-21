<template>
  <div>
    <h1>{{ testStore.counter }}</h1>

    <button @click="testStore.increment()">
      inc
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTestStore } from './store/test'

const testStore = useTestStore()
</script>
