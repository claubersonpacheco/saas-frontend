<script setup lang="ts">
import { Activity, Building2, CreditCard, ShieldCheck, UsersRound } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import { apiRequest } from '../services/api';
import { hasPermission } from '../services/permissions';

const loading = ref(true);
const counts = ref([
  { label: 'Usuarios', value: '-', icon: UsersRound, path: '/users', resource: 'users', permission: 'users.read' },
  { label: 'Roles', value: '-', icon: ShieldCheck, path: '/roles', resource: 'roles', permission: 'roles.read' },
  { label: 'Planes', value: '-', icon: CreditCard, path: '/plans', resource: 'plans', permission: 'plans.read' },
  { label: 'Empresas', value: '-', icon: Building2, path: '/tenants', resource: 'tenants', permission: 'tenants.read' },
]);

const visibleCounts = computed(() =>
  counts.value.filter((item) => hasPermission(item.permission)),
);

async function loadCounts() {
  loading.value = true;
  const visibleItems = visibleCounts.value;
  const results = await Promise.allSettled(
    visibleItems.map((item) => apiRequest<unknown[]>(`/${item.resource}`)),
  );

  counts.value = counts.value.map((item) => {
    const index = visibleItems.findIndex((visibleItem) => visibleItem.resource === item.resource);

    if (index < 0) {
      return item;
    }

    return {
      ...item,
      value: results[index].status === 'fulfilled' ? String(results[index].value.length) : 'sin acceso',
    };
  });

  loading.value = false;
}

onMounted(loadCounts);
</script>

<template>
  <AppShell>
    <template #title>Vista general</template>

    <section class="metric-grid">
      <RouterLink v-for="item in visibleCounts" :key="item.label" class="metric-card" :to="item.path">
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
        <strong>{{ loading ? '...' : item.value }}</strong>
      </RouterLink>
    </section>

    <section class="panel">
      <div class="panel-title">
        <Activity :size="20" />
        <h2>Operación</h2>
      </div>
      <p class="muted">
        El frontend está integrado con los endpoints protegidos de NestJS usando el token recibido en
        <code>/auth/login</code>. Los contadores muestran los datos disponibles según los permisos del usuario conectado.
      </p>
    </section>
  </AppShell>
</template>
