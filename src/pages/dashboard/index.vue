<script setup lang="ts">
import { Activity, Building2, CalendarDays, ClipboardList, Copy, CreditCard, MapPin, ShieldCheck, UsersRound } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import { getValue } from '../../resources';
import { apiRequest } from '../../services/api';
import { hasPermission, hasPlanModule } from '../../services/permissions';
import { authState } from '../../stores/auth';
import type { Service } from '../../types';

const loading = ref(true);
const loadingTodayServices = ref(false);
const todayServicesError = ref('');
const todayServicesMessage = ref('');
const todayServices = ref<Service[]>([]);
const counts = ref([
  { label: 'Usuarios', value: '-', icon: UsersRound, path: '/users', resource: 'users', permission: 'users.read' },
  { label: 'Roles', value: '-', icon: ShieldCheck, path: '/roles', resource: 'roles', permission: 'roles.read' },
  { label: 'Planes', value: '-', icon: CreditCard, path: '/plans', resource: 'plans', permission: 'plans.read' },
  { label: 'Empresas', value: '-', icon: Building2, path: '/tenants', resource: 'tenants', permission: 'tenants.read' },
  { label: 'Servicios', value: '-', icon: ClipboardList, path: '/services', resource: 'services', permission: 'services.read' },
]);

const visibleCounts = computed(() =>
  counts.value.filter((item) => hasPermission(item.permission)),
);
const canViewServices = computed(() => hasPlanModule('services') && hasPermission('services.read'));
const canCreateServices = computed(() => canViewServices.value && hasPermission('services.create'));

function todayKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function serviceDateKey(value?: string | null): string {
  return String(value || '').slice(0, 10);
}

function canSeeAllTodayServices(): boolean {
  const roleName = authState.user?.role?.name.toLowerCase();

  return roleName === 'admin' || roleName === 'master';
}

function isCurrentUserService(service: Service): boolean {
  return service.userId === authState.user?.id || service.user?.id === authState.user?.id;
}

function serviceTime(value?: string | null): string {
  const time = String(value || '').trim();

  return time ? time.slice(0, 5) : '--:--';
}

function serviceScheduleTime(value?: string | null): string {
  const time = String(value || '').trim();

  return time ? time.slice(0, 5) : '99:99';
}

function compareServicesBySchedule(first: Service, second: Service): number {
  const dateComparison = serviceDateKey(first.dateStart).localeCompare(serviceDateKey(second.dateStart));

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const timeComparison = serviceScheduleTime(first.hourStart).localeCompare(serviceScheduleTime(second.hourStart));

  return timeComparison !== 0 ? timeComparison : first.id - second.id;
}

function serviceStatus(service: Service): string {
  return getValue(service as unknown as Record<string, unknown>, 'status') || '-';
}

function serviceAddress(service: Service): string {
  return getValue(service as unknown as Record<string, unknown>, 'fullAddress');
}

function serviceMapsUrl(service: Service): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceAddress(service))}`;
}

function serviceResponsible(service: Service): string {
  return [service.user?.name, service.user?.lastname].filter(Boolean).join(' ') || service.user?.username || '-';
}

async function copyServiceCode(service: Service) {
  if (!service.code) {
    return;
  }

  try {
    await navigator.clipboard.writeText(service.code);
    todayServicesMessage.value = 'Código del servicio copiado.';
    todayServicesError.value = '';
  } catch {
    todayServicesMessage.value = '';
    todayServicesError.value = 'No se pudo copiar el código.';
  }
}

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

async function loadTodayServices() {
  if (!canViewServices.value) {
    return;
  }

  loadingTodayServices.value = true;
  todayServicesError.value = '';
  todayServicesMessage.value = '';

  try {
    const services = await apiRequest<Service[]>('/services');
    const today = todayKey();

    todayServices.value = services
      .filter((service) => serviceDateKey(service.dateStart) === today)
      .filter((service) => canSeeAllTodayServices() || isCurrentUserService(service))
      .sort(compareServicesBySchedule);
  } catch (error) {
    todayServicesError.value =
      error instanceof Error ? error.message : 'No fue posible cargar los servicios de hoy.';
  } finally {
    loadingTodayServices.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadCounts(), loadTodayServices()]);
});
</script>

<template>
  <AppShell>
    <template #title>Bienvenido</template>

    <section class="metric-grid">
      <RouterLink v-for="item in visibleCounts" :key="item.label" class="metric-card" :to="item.path">
        <component :is="item.icon" :size="22" />
        <span>{{ item.label }}</span>
        <strong>{{ loading ? '...' : item.value }}</strong>
      </RouterLink>
    </section>

    <section v-if="canViewServices" class="panel today-services-panel">
      <div class="panel-title">
        <CalendarDays :size="20" />
        <h2>Servicios de hoy</h2>
        <RouterLink v-if="canCreateServices" class="primary-button compact-button" to="/services/create">
          Crear servicio
        </RouterLink>
        <RouterLink class="secondary-button compact-button" to="/services">Ver todos</RouterLink>
      </div>

      <p v-if="loadingTodayServices" class="muted">Cargando servicios del dia...</p>
      <p v-else-if="todayServicesMessage" class="alert success">{{ todayServicesMessage }}</p>
      <p v-else-if="todayServicesError" class="alert error">{{ todayServicesError }}</p>
      <p v-else-if="todayServices.length === 0" class="muted">No hay servicios programados para hoy.</p>

      <div v-else class="today-services-list">
        <RouterLink
          v-for="service in todayServices"
          :key="service.id"
          class="today-service-row"
          :to="`/services/${service.id}/edit`"
        >
          <div class="today-service-time">
            <strong>{{ serviceTime(service.hourStart) }}</strong>
            <span>{{ serviceTime(service.hourEnd) }}</span>
          </div>

          <div class="today-service-main">
            <div class="today-service-heading">
              <span class="today-service-code">
                <strong>{{ service.code }}</strong>
                <button
                  class="resource-table-icon compact-icon"
                  type="button"
                  title="Copiar código"
                  aria-label="Copiar código"
                  @click.prevent="copyServiceCode(service)"
                >
                  <Copy :size="15" />
                </button>
              </span>
              <span>{{ serviceStatus(service) }}</span>
            </div>
            <a
              v-if="serviceAddress(service) !== '-'"
              class="today-service-map-link"
              :href="serviceMapsUrl(service)"
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en Google Maps"
              @click.stop
            >
              <MapPin :size="15" />
              {{ serviceAddress(service) }}
            </a>
            <p v-else>
              <MapPin :size="15" />
              {{ serviceAddress(service) }}
            </p>
          </div>

          <div class="today-service-user">{{ serviceResponsible(service) }}</div>
        </RouterLink>
      </div>
    </section>

    <section v-else class="panel">
      <div class="panel-title">
        <Activity :size="20" />
        <h2>Operación</h2>
      </div>
    </section>
  </AppShell>
</template>
