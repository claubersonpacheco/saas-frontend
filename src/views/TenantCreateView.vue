<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import { apiRequest } from '../services/api';
import type { Plan, Tenant } from '../types';

const router = useRouter();
const loading = ref(false);
const loadingPlans = ref(false);
const error = ref('');
const plans = ref<Plan[]>([]);

const form = reactive({
  name: '',
  slug: '',
  planId: '',
  active: true,
  adminUsername: '',
  adminName: '',
  adminLastname: '',
  adminEmail: '',
  adminPassword: '',
});

async function loadPlans() {
  loadingPlans.value = true;

  try {
    plans.value = await apiRequest<Plan[]>('/plans');
  } catch {
    plans.value = [];
  } finally {
    loadingPlans.value = false;
  }
}

async function save() {
  loading.value = true;
  error.value = '';

  try {
    await apiRequest<Tenant>('/tenants', {
      method: 'POST',
      body: {
        name: form.name,
        slug: form.slug || undefined,
        planId: form.planId ? Number(form.planId) : undefined,
        active: form.active,
        adminUsername: form.adminUsername,
        adminName: form.adminName,
        adminLastname: form.adminLastname || undefined,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      },
    });

    router.push('/tenants');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear la empresa.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadPlans);
</script>

<template>
  <AppShell>
    <template #title>Nueva empresa</template>

    <section class="page-actions">
      <RouterLink class="secondary-button" to="/tenants">
        <ArrowLeft :size="18" />
        Volver
      </RouterLink>
    </section>

    <section class="panel narrow">
      <div class="panel-title">
        <h2>Crear empresa</h2>
      </div>

      <form class="form-grid" @submit.prevent="save">
        <label>
          Nombre
          <input v-model="form.name" required />
        </label>

        <label>
          Slug
          <input v-model="form.slug" placeholder="se genera automáticamente si queda vacío" />
        </label>

        <label>
          Plan
          <select v-model="form.planId" :disabled="loadingPlans">
            <option value="">Sin plan</option>
            <option v-for="plan in plans" :key="plan.id" :value="String(plan.id)">
              {{ plan.name }}
            </option>
          </select>
        </label>

        <label>
          Estado
          <span class="switch-row">
            <input v-model="form.active" type="checkbox" />
            <span>{{ form.active ? 'Activo' : 'Inactivo' }}</span>
          </span>
        </label>

        <div class="form-section-title">
          <h3>Administrador de la empresa</h3>
        </div>

        <label>
          Usuario admin
          <input v-model="form.adminUsername" autocomplete="off" required />
        </label>

        <label>
          Nombre
          <input v-model="form.adminName" required />
        </label>

        <label>
          Apellido
          <input v-model="form.adminLastname" />
        </label>

        <label>
          Correo electrónico
          <input v-model="form.adminEmail" type="email" required />
        </label>

        <label>
          Contraseña
          <input v-model="form.adminPassword" type="password" autocomplete="new-password" minlength="8" required />
        </label>

        <p v-if="error" class="alert error">{{ error }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          <Save :size="18" />
          {{ loading ? 'Guardando...' : 'Crear empresa' }}
        </button>
      </form>
    </section>
  </AppShell>
</template>
