import { createRouter, createWebHistory } from 'vue-router';
import { canAccessResource, hasPermission, resourceReadPermissions } from './services/permissions';
import { authState } from './stores/auth';
import DashboardView from './views/DashboardView.vue';
import LoginView from './views/LoginView.vue';
import ProfileView from './views/ProfileView.vue';
import ResourceView from './views/ResourceView.vue';
import RoleFormView from './views/RoleFormView.vue';
import TenantCreateView from './views/TenantCreateView.vue';
import UserFormView from './views/UserFormView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/perfil', name: 'profile', component: ProfileView },
    { path: '/tenants/create', name: 'tenant-create', component: TenantCreateView, meta: { permission: 'tenants.create' } },
    { path: '/users/create', name: 'user-create', component: UserFormView, meta: { permission: 'users.create' } },
    { path: '/users/:id/edit', name: 'user-edit', component: UserFormView, meta: { permission: 'users.update' } },
    { path: '/roles/create', name: 'role-create', component: RoleFormView, meta: { permission: 'roles.create' } },
    { path: '/roles/:id/edit', name: 'role-edit', component: RoleFormView, meta: { permission: 'roles.update' } },
    { path: '/:resource(users|roles|permissions|plans|tenants|settings)', name: 'resource', component: ResourceView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.public && !authState.accessToken) {
    return { name: 'login' };
  }

  if (to.name === 'login' && authState.accessToken) {
    return { name: 'dashboard' };
  }

  const permission =
    (to.meta.permission as string | undefined) ||
    (to.name === 'resource'
      ? resourceReadPermissions[String(to.params.resource)]
      : undefined);

  if (to.name === 'resource' && !canAccessResource(String(to.params.resource))) {
    return { name: 'dashboard' };
  }

  if (permission && !hasPermission(permission)) {
    return { name: 'dashboard' };
  }

  return true;
});
