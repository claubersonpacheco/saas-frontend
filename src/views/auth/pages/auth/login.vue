<script setup lang="ts">
import { Eye, EyeOff, LogIn } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '@/services/api';
import { authState, setSession } from '@/stores/auth';
import { brandingState, loadPublicBranding } from '@/stores/branding';
import type { User } from '@/types';

const router = useRouter();
const tenantSlug = import.meta.env.VITE_TENANT_SLUG || 'organizarte';
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const form = reactive({
  identifier: '',
  password: '',
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

onMounted(() => {
  if (!authState.accessToken) {
    loadPublicBranding(tenantSlug);
  }
});
</script>

<template>
  <main class="login-screen">
    <section class="login-panel">
      <div class="login-brand">
        <span class="brand-mark" :class="{ 'brand-mark-fallback': !brandingState.logo }">
          <img v-if="brandingState.logo" :src="brandingState.logo" :alt="brandingState.name" />
          <span v-else>OA</span>
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

        <p v-if="error" class="alert error">{{ error }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          <LogIn :size="18" />
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="login-footer">
        <span><a href="https://ferchecosolutions.com" target="_blank">by Fercheco Solutions</a></span>
      </div>
    </section>
  </main>
</template>
