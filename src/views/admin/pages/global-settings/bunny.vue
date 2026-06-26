<script setup lang="ts">
import { Save } from '@lucide/vue';
import { onMounted, reactive, ref } from 'vue';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import { apiRequest } from '@/services/api';

type BunnySettings = {
  bunnyStorageZoneName?: string | null;
  bunnyStorageAccessKey?: string | null;
  bunnyStorageCdnDomain?: string | null;
  bunnyStorageBaseUrl?: string | null;
  bunnyStorageUserFolder?: string | null;
  bunnyStorageLogoFolder?: string | null;
};

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const message = ref('');
const form = reactive<Record<keyof BunnySettings, string>>({
  bunnyStorageZoneName: '',
  bunnyStorageAccessKey: '',
  bunnyStorageCdnDomain: '',
  bunnyStorageBaseUrl: '',
  bunnyStorageUserFolder: 'users',
  bunnyStorageLogoFolder: 'logos',
});

function applySettings(settings: BunnySettings) {
  Object.keys(form).forEach((key) => {
    const field = key as keyof BunnySettings;
    form[field] = String(settings[field] || '');
  });

  form.bunnyStorageUserFolder ||= 'users';
  form.bunnyStorageLogoFolder ||= 'logos';
}

async function loadSettings() {
  loading.value = true;
  error.value = '';

  try {
    applySettings(await apiRequest<BunnySettings>('/global-settings/bunny'));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar la configuración.';
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim() || undefined]),
    );
    applySettings(
      await apiRequest<BunnySettings>('/global-settings/bunny', {
        method: 'PATCH',
        body: payload,
      }),
    );
    message.value = 'Configuración global guardada.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la configuración.';
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <AdminLayout>
    <template #title>Bunny global</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>Bunny global</h2>
        <p>Esta configuración es única para todo el sistema y solo el master puede modificarla.</p>
      </div>

      <form @submit.prevent="saveSettings">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="bunnyStorageZoneName">Zona Bunny</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageZoneName" v-model="form.bunnyStorageZoneName" :disabled="loading" required />
          </div>

          <div class="form-label">
            <label for="bunnyStorageAccessKey">Clave de acceso Bunny</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageAccessKey" v-model="form.bunnyStorageAccessKey" :disabled="loading" required />
          </div>

          <div class="form-label">
            <label for="bunnyStorageCdnDomain">Dominio CDN Bunny</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageCdnDomain" v-model="form.bunnyStorageCdnDomain" :disabled="loading" placeholder="https://cdn.example.com" />
          </div>

          <div class="form-label">
            <label for="bunnyStorageBaseUrl">URL base Bunny</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageBaseUrl" v-model="form.bunnyStorageBaseUrl" :disabled="loading" placeholder="opcional si usa CDN" />
          </div>

          <div class="form-label">
            <label for="bunnyStorageUserFolder">Carpeta de usuarios</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageUserFolder" v-model="form.bunnyStorageUserFolder" :disabled="loading" required />
          </div>

          <div class="form-label">
            <label for="bunnyStorageLogoFolder">Carpeta de logos</label>
          </div>
          <div class="form-field">
            <input id="bunnyStorageLogoFolder" v-model="form.bunnyStorageLogoFolder" :disabled="loading" required />
          </div>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>
        <p v-if="message" class="alert success">{{ message }}</p>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="loading || saving">
            <Save :size="18" />
            {{ saving ? 'Guardando...' : 'Guardar configuración' }}
          </button>
        </div>
      </form>
    </section>
  </AdminLayout>
</template>
