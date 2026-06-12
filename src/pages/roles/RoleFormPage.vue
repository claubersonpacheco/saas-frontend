<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '../../components/AppShell.vue';
import { apiRequest } from '../../services/api';
import type { Permission, Role } from '../../types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingRecord = ref(false);
const loadingPermissions = ref(false);
const error = ref('');
const permissions = ref<Permission[]>([]);
const selectedPermissionIds = ref<number[]>([]);

const roleId = computed(() => String(route.params.id || ''));
const isEditing = computed(() => Boolean(roleId.value));
const title = computed(() => (isEditing.value ? 'Editar rol' : 'Nuevo rol'));

const form = reactive({
  name: '',
  description: '',
});

async function loadPermissions() {
  loadingPermissions.value = true;

  try {
    permissions.value = await apiRequest<Permission[]>('/permissions');
  } catch {
    permissions.value = [];
  } finally {
    loadingPermissions.value = false;
  }
}

async function loadRole() {
  if (!isEditing.value) {
    return;
  }

  loadingRecord.value = true;
  error.value = '';

  try {
    const role = await apiRequest<Role>(`/roles/${roleId.value}`);
    form.name = role.name || '';
    form.description = role.description || '';
    selectedPermissionIds.value = role.permissions?.map((permission) => permission.id) || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el rol.';
  } finally {
    loadingRecord.value = false;
  }
}

async function save() {
  loading.value = true;
  error.value = '';

  const body = {
    name: form.name,
    description: form.description || undefined,
    permissionIds: selectedPermissionIds.value,
  };

  try {
    if (isEditing.value) {
      await apiRequest<Role>(`/roles/${roleId.value}`, {
        method: 'PATCH',
        body,
      });
    } else {
      await apiRequest<Role>('/roles', {
        method: 'POST',
        body,
      });
    }

    router.push('/roles');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el rol.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPermissions();
  loadRole();
});
</script>

<template>
  <AppShell>
    <template #title>{{ title }}</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>{{ title }}</h2>
        <p>Configure el rol y seleccione los permisos disponibles para el acceso.</p>
      </div>

      <form @submit.prevent="save">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="roleName">Nombre</label>
          </div>
          <div class="form-field">
            <input id="roleName" v-model="form.name" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="roleDescription">Descripción</label>
          </div>
          <div class="form-field">
            <textarea id="roleDescription" v-model="form.description" :disabled="loadingRecord" />
          </div>

          <div class="form-label">
            <span>Permisos</span>
          </div>
          <div class="form-field">
            <div class="check-grid">
              <label v-for="permission in permissions" :key="permission.id" class="check-option">
                <input
                  v-model="selectedPermissionIds"
                  type="checkbox"
                  :value="permission.id"
                  :disabled="loadingRecord || loadingPermissions"
                />
                <span>
                  <strong>{{ permission.name }}</strong>
                  <small>{{ permission.description || 'Sin descripción' }}</small>
                </span>
              </label>
            </div>
          </div>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <RouterLink class="secondary-button" to="/roles">
            <ArrowLeft :size="18" />
            Volver
          </RouterLink>
          <button class="primary-button" type="submit" :disabled="loading || loadingRecord">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Guardar rol' }}
          </button>
        </div>
      </form>
    </section>
  </AppShell>
</template>
