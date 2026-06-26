<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import { apiRequest } from '@/services/api';
import type { Role, User } from '@/types';

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
  <AdminLayout>
    <template #title>{{ title }}</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>{{ title }}</h2>
        <p>Administre los datos de acceso, información personal y rol del usuario.</p>
      </div>

      <form @submit.prevent="save">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="username">Usuario</label>
          </div>
          <div class="form-field">
            <input id="username" v-model="form.username" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="name">Nombre</label>
          </div>
          <div class="form-field">
            <input id="name" v-model="form.name" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="lastname">Apellido</label>
          </div>
          <div class="form-field">
            <input id="lastname" v-model="form.lastname" :disabled="loadingRecord" />
          </div>

          <div class="form-label">
            <label for="email">Correo electrónico</label>
          </div>
          <div class="form-field">
            <input id="email" v-model="form.email" type="email" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="roleId">Rol</label>
          </div>
          <div class="form-field">
            <select id="roleId" v-model="form.roleId" :disabled="loadingRecord || loadingRoles">
              <option value="">Sin rol</option>
              <option v-for="role in roles" :key="role.id" :value="String(role.id)">
                {{ role.name }}
              </option>
            </select>
          </div>

          <div class="form-label">
            <label for="password">Contraseña</label>
          </div>
          <div class="form-field">
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              :required="!isEditing"
              :disabled="loadingRecord"
            />
          </div>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <RouterLink class="secondary-button" to="/users">
            <ArrowLeft :size="18" />
            Volver
          </RouterLink>
          <button class="primary-button" type="submit" :disabled="loading || loadingRecord">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Guardar usuario' }}
          </button>
        </div>
      </form>
    </section>
  </AdminLayout>
</template>
