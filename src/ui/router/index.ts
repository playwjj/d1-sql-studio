import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHashHistory('/dashboard'),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
    { path: '/setup', name: 'setup', component: () => import('@/views/auth/FirstTimeSetupView.vue') },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/tables' },
        { path: 'tables', name: 'tables', component: () => import('@/views/tables/TablesView.vue') },
        { path: 'data',   name: 'data',   component: () => import('@/views/data/DataBrowserView.vue') },
        { path: 'query',  name: 'query',  component: () => import('@/views/query/QueryEditorView.vue') },
        { path: 'keys',   name: 'keys',   component: () => import('@/views/keys/ApiKeysView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/tables' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.hasCheckedKeysStatus) {
    await auth.checkKeysStatus();
  }

  if (!auth.hasKeys && to.name !== 'setup') {
    return { name: 'setup' };
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }

  if (auth.isAuthenticated && (to.name === 'login' || to.name === 'setup')) {
    return { name: 'tables' };
  }
});

export default router;
