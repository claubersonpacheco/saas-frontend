<script setup lang="ts">
import { Eye, EyeOff, KeyRound, LogIn } from '@lucide/vue';
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../../services/api';
import { setSession } from '../../stores/auth';
import { brandingState, loadPublicBranding } from '../../stores/branding';
import type { User } from '../../types';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
let brandingTimer: number | undefined;

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

watch(
  () => form.tenantSlug,
  (tenantSlug) => {
    window.clearTimeout(brandingTimer);
    brandingTimer = window.setTimeout(() => {
      loadPublicBranding(tenantSlug);
    }, 350);
  },
);
</script>

<template>
  <main class="login-screen">
    <section class="login-panel">
      <div class="login-brand">
        <span class="brand-mark">
          <img v-if="brandingState.logo" :src="brandingState.logo" :alt="brandingState.name" />
          <span v-else>M</span>
        </span>
        <div>
          <p class="eyebrow">{{ brandingState.name }}</p>
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
          <span class="password-field">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </span>
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
        <span><a href="https://ferchecosolutions.com" target="_blank">by Fercheco Solutions</a></span>
      </div>
    </section>
  </main>
</template>
