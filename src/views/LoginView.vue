<script setup lang="ts">
import { KeyRound, LogIn } from '@lucide/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../services/api';
import { setSession } from '../stores/auth';
import type { User } from '../types';

const router = useRouter();
const loading = ref(false);
const error = ref('');

const form = reactive({
  identifier: '',
  password: '',
  tenantSlug: '',
});

async function submit() {
  loading.value = true;
  error.value = '';

  try {
    const response = await apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: {
        identifier: form.identifier,
        password: form.password,
        tenantSlug: form.tenantSlug || undefined,
      },
    });

    setSession(response.accessToken, response.user);
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo iniciar sesión.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-screen">
    <section class="login-panel">
      <div class="login-brand">
        <span class="brand-mark">M</span>
        <div>
          <p class="eyebrow">MiControl</p>
          <h1>Entrar al panel</h1>
        </div>
      </div>

      <form class="form-stack" @submit.prevent="submit">
        <label>
          Usuario o correo
          <input v-model="form.identifier" autocomplete="username" required />
        </label>

        <label>
          Contraseña
          <input v-model="form.password" type="password" autocomplete="current-password" required />
        </label>

        <label>
          Slug del tenant
          <input v-model="form.tenantSlug" placeholder="opcional cuando el usuario es único" />
        </label>

        <p v-if="error" class="alert error">{{ error }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          <LogIn :size="18" />
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="login-footer">
        <KeyRound :size="16" />
        <span>JWT guardado localmente para llamar a la API NestJS.</span>
      </div>
    </section>
  </main>
</template>
