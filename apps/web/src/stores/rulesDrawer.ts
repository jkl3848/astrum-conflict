import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRulesDrawer = defineStore('rulesDrawer', () => {
  const isOpen = ref(false)
  const sectionId = ref<string | null>(null)
  const query = ref('')

  function open(section?: string) {
    isOpen.value = true
    sectionId.value = section ?? null
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { isOpen, sectionId, query, open, close, toggle }
})
