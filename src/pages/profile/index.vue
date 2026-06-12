<script setup lang="ts">
import { Save } from '@lucide/vue';
import { reactive, ref } from 'vue';
import AppShell from '../../components/AppShell.vue';
import { apiRequest } from '../../services/api';
import { authState, updateUser } from '../../stores/auth';
import type { User } from '../../types';

const loading = ref(false);
const message = ref('');
const error = ref('');

const form = reactive({
  username: authState.user?.username || '',
  name: authState.user?.name || '',
  lastname: authState.user?.lastname || '',
  email: authState.user?.email || '',
});

async function save() {
  if (!authState.user) {
    return;
  }

  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    const user = await apiRequest<User>(`/users/${authState.user.id}`, {
      method: 'PATCH',
      body: form,
    });
    updateUser(user);
    message.value = 'Perfil actualizado.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppShell>
    <template #title>Mi perfil</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>Mi perfil</h2>
        <p>Administre su información personal y datos de contacto.</p>
      </div>

      <form @submit.prevent="save">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="profileUsername">Usuario</label>
          </div>
          <div class="form-field">
            <input id="profileUsername" v-model="form.username" required />
          </div>

          <div class="form-label">
            <label for="profileName">Nombre</label>
          </div>
          <div class="form-field">
            <input id="profileName" v-model="form.name" required />
          </div>

          <div class="form-label">
            <label for="profileLastname">Apellido</label>
          </div>
          <div class="form-field">
            <input id="profileLastname" v-model="form.lastname" />
          </div>

          <div class="form-label">
            <label for="profileEmail">Correo electrónico</label>
          </div>
          <div class="form-field">
            <input id="profileEmail" v-model="form.email" type="email" required />
          </div>
        </div>

        <p v-if="message" class="alert success">{{ message }}</p>
        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="loading">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Guardar perfil' }}
          </button>
        </div>
      </form>
    </section>
  </AppShell>
</template>
