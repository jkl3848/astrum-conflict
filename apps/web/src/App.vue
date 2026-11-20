<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppShell from './ui/AppShell.vue'
import WhatsNewModal from './ui/WhatsNewModal.vue'
import UpdateToast from './ui/UpdateToast.vue'
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
  <WhatsNewModal />
  <UpdateToast />
</template>
