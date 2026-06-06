<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import { apiRequest } from '../services/api';
import type { Role, User } from '../types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingRecord = ref(false);
const loadingRoles = ref(false);
const error = ref('');
const roles = ref<Role[]>([]);

const userId = computed(() => String(route.params.id || ''));
const isEditing = computed(() => Boolean(userId.value));
const title = computed(() => (isEditing.value ? 'Editar usuario' : 'Nuevo usuario'));

const form = reactive({
  username: '',
  name: '',
  lastname: '',
  email: '',
  roleId: '',
  password: '',
});

async function loadRoles() {
  loadingRoles.value = true;

  try {
    roles.value = await apiRequest<Role[]>('/roles');
  } catch {
    roles.value = [];
  } finally {
    loadingRoles.value = false;
  }
}

async function loadUser() {
  if (!isEditing.value) {
    return;
  }

  loadingRecord.value = true;
  error.value = '';

  try {
    const user = await apiRequest<User>(`/users/${userId.value}`);
    form.username = user.username || '';
    form.name = user.name || '';
    form.lastname = user.lastname || '';
    form.email = user.email || '';
    form.roleId = user.role?.id ? String(user.role.id) : '';
    form.password = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el usuario.';
  } finally {
    loadingRecord.value = false;
  }
}

function payload() {
  const body: Record<string, unknown> = {
    username: form.username,
    name: form.name,
    lastname: form.lastname || undefined,
    email: form.email,
    roleId: form.roleId ? Number(form.roleId) : undefined,
  };

  if (!isEditing.value || form.password) {
    body.password = form.password;
  }

  return body;
}

async function save() {
  loading.value = true;
  error.value = '';

  try {
    if (isEditing.value) {
      await apiRequest<User>(`/users/${userId.value}`, {
        method: 'PATCH',
        body: payload(),
      });
    } else {
      await apiRequest<User>('/users', {
        method: 'POST',
        body: payload(),
      });
    }

    router.push('/users');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el usuario.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRoles();
  loadUser();
});
</script>

<template>
  <AppShell>
    <template #title>{{ title }}</template>

    <section class="page-actions">
      <RouterLink class="secondary-button" to="/users">
        <ArrowLeft :size="18" />
        Volver
      </RouterLink>
    </section>

    <section class="panel narrow">
      <div class="panel-title">
        <h2>{{ title }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="save">
        <label>
          Usuario
          <input v-model="form.username" :disabled="loadingRecord" required />
        </label>

        <label>
          Nombre
          <input v-model="form.name" :disabled="loadingRecord" required />
        </label>

        <label>
          Apellido
          <input v-model="form.lastname" :disabled="loadingRecord" />
        </label>

        <label>
          Correo electrónico
          <input v-model="form.email" type="email" :disabled="loadingRecord" required />
        </label>

        <label>
          Rol
          <select v-model="form.roleId" :disabled="loadingRecord || loadingRoles">
            <option value="">Sin rol</option>
            <option v-for="role in roles" :key="role.id" :value="String(role.id)">
              {{ role.name }}
            </option>
          </select>
        </label>

        <label>
          Contraseña
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            :required="!isEditing"
            :disabled="loadingRecord"
          />
        </label>

        <p v-if="error" class="alert error">{{ error }}</p>

        <button class="primary-button" type="submit" :disabled="loading || loadingRecord">
          <Save :size="18" />
          {{ loading ? 'Guardando...' : 'Guardar usuario' }}
        </button>
      </form>
    </section>
  </AppShell>
</template>
