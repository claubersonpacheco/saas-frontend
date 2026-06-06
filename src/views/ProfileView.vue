<script setup lang="ts">
import { Save } from '@lucide/vue';
import { reactive, ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import { apiRequest } from '../services/api';
import { authState, updateUser } from '../stores/auth';
import type { User } from '../types';

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

    <section class="panel narrow">
      <form class="form-grid" @submit.prevent="save">
        <label>
          Usuario
          <input v-model="form.username" required />
        </label>
        <label>
          Nombre
          <input v-model="form.name" required />
        </label>
        <label>
          Apellido
          <input v-model="form.lastname" />
        </label>
        <label>
          Correo electrónico
          <input v-model="form.email" type="email" required />
        </label>
        <p v-if="message" class="alert success">{{ message }}</p>
        <p v-if="error" class="alert error">{{ error }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          <Save :size="18" />
          {{ loading ? 'Guardando...' : 'Guardar perfil' }}
        </button>
      </form>
    </section>
  </AppShell>
</template>
