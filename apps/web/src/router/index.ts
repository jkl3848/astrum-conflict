import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/HomePage.vue') },
    { path: '/build', name: 'build', component: () => import('../pages/BuildPage.vue') },
    { path: '/rules', name: 'rules', component: () => import('../pages/RulesPage.vue') },
    { path: '/changelog', name: 'changelog', component: () => import('../pages/ChangelogPage.vue') },
    { path: '/play/:code?', name: 'play', component: () => import('../pages/PlayPage.vue') },
    { path: '/join', name: 'join', component: () => import('../pages/JoinPage.vue') },
    { path: '/proof', name: 'proof', component: () => import('../pages/ProofPage.vue') },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
