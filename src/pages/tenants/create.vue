<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from '../../components/AppShell.vue';
import { apiRequest } from '../../services/api';
import type { Plan, Tenant } from '../../types';

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

    <section class="form-card">
      <div class="form-card-header">
        <h2>Crear empresa</h2>
        <p>Defina los datos de la empresa, su plan y el administrador inicial.</p>
      </div>

      <form @submit.prevent="save">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="tenantName">Nombre</label>
          </div>
          <div class="form-field">
            <input id="tenantName" v-model="form.name" required />
          </div>

          <div class="form-label">
            <label for="tenantSlug">Slug</label>
          </div>
          <div class="form-field">
            <input id="tenantSlug" v-model="form.slug" placeholder="se genera automáticamente si queda vacío" />
          </div>

          <div class="form-label">
            <label for="tenantPlan">Plan</label>
          </div>
          <div class="form-field">
            <select id="tenantPlan" v-model="form.planId" :disabled="loadingPlans">
              <option value="">Tenant central (sin plan)</option>
              <option v-for="plan in plans" :key="plan.id" :value="String(plan.id)">
                {{ plan.name }}
              </option>
            </select>
          </div>

          <div class="form-label">
            <label for="tenantActive">Estado</label>
          </div>
          <div class="form-field">
            <span class="switch-row">
              <input id="tenantActive" v-model="form.active" type="checkbox" />
              <span>{{ form.active ? 'Activo' : 'Inactivo' }}</span>
            </span>
          </div>

          <div class="form-divider">
            <h3>Administrador de la empresa</h3>
          </div>

          <div class="form-label">
            <label for="adminUsername">Usuario admin</label>
          </div>
          <div class="form-field">
            <input id="adminUsername" v-model="form.adminUsername" autocomplete="off" required />
          </div>

          <div class="form-label">
            <label for="adminName">Nombre</label>
          </div>
          <div class="form-field">
            <input id="adminName" v-model="form.adminName" required />
          </div>

          <div class="form-label">
            <label for="adminLastname">Apellido</label>
          </div>
          <div class="form-field">
            <input id="adminLastname" v-model="form.adminLastname" />
          </div>

          <div class="form-label">
            <label for="adminEmail">Correo electrónico</label>
          </div>
          <div class="form-field">
            <input id="adminEmail" v-model="form.adminEmail" type="email" required />
          </div>

          <div class="form-label">
            <label for="adminPassword">Contraseña</label>
          </div>
          <div class="form-field">
            <input id="adminPassword" v-model="form.adminPassword" type="password" autocomplete="new-password" minlength="8" required />
          </div>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <RouterLink class="secondary-button" to="/tenants">
            <ArrowLeft :size="18" />
            Volver
          </RouterLink>
          <button class="primary-button" type="submit" :disabled="loading">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Crear empresa' }}
          </button>
        </div>
      </form>
    </section>
  </AppShell>
</template>
