<template>
  <AdminLayout>
    <template #title>Seguridad</template>

    <section class="panel narrow profile-panel">
      <div v-if="currentUser" class="profile-content">
        <form class="profile-form" @submit.prevent="changePassword">
          <div class="form-row-grid profile-form-grid">
            <div class="form-label">
              <label for="currentPassword">Contraseña actual</label>
            </div>
            <div class="form-field">
              <input
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                type="password"
                autocomplete="current-password"
                required
                :disabled="saving"
              />
            </div>

            <div class="form-label">
              <label for="password">Nueva contraseña</label>
            </div>
            <div class="form-field">
              <input
                id="password"
                v-model="passwordForm.password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                :disabled="saving"
              />
              <p class="profile-help">Debe tener al menos 8 caracteres.</p>
            </div>

            <div class="form-label">
              <label for="confirmPassword">Confirmar contraseña</label>
            </div>
            <div class="form-field">
              <input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                :disabled="saving"
              />
            </div>
          </div>

          <p v-if="saveError" class="alert error">{{ saveError }}</p>
          <p v-if="saveMessage" class="alert success">{{ saveMessage }}</p>

          <div class="form-actions profile-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </div>

      <p v-else-if="!error" class="muted">Buscando informacoes no servidor...</p>

      <div v-else class="profile-error">
        <p class="alert error">Nao foi possivel carregar os dados. Verifique a conexao com o backend.</p>
        <button class="secondary-button" type="button" @click="fetchProfile">Tentar novamente</button>
      </div>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import { apiRequest } from '@/services/api';
import { authState, updateUser } from '@/stores/auth';
import type { User } from '@/types';

const error = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveMessage = ref('');
const currentUser = ref<User | null>(authState.user);
const passwordForm = reactive({
  currentPassword: '',
  password: '',
  confirmPassword: '',
});

function resetForm() {
  passwordForm.currentPassword = '';
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
}

const fetchProfile = async () => {
  error.value = false;
  try {
    const user = await apiRequest<User>('/auth/me');
    currentUser.value = user;
    updateUser(user);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    error.value = true;
  }
};

async function changePassword() {
  if (!currentUser.value) {
    return;
  }

  saveError.value = '';
  saveMessage.value = '';

  if (passwordForm.password.length < 8) {
    saveError.value = 'La nueva contraseña debe tener al menos 8 caracteres.';
    return;
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {
    saveError.value = 'La confirmacion no coincide con la nueva contraseña.';
    return;
  }

  saving.value = true;

  try {
    await apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
      },
    });
    resetForm();
    saveMessage.value = 'Contraseña actualizada con exito.';
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchProfile();
});
</script>

<style scoped>
.profile-panel {
  display: grid;
  gap: 20px;
}

.profile-content {
  display: grid;
  gap: 20px;
}

.profile-form {
  display: grid;
  gap: 16px;
}

.profile-form-grid {
  grid-template-columns: minmax(130px, 2fr) minmax(0, 7fr);
}

.profile-readonly {
  min-height: 40px;
  border: 1px solid #dfe7e2;
  border-radius: 8px;
  background: #f7faf8;
  color: #687873;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 650;
}

.profile-help {
  margin: 6px 0 0;
  color: #687873;
  font-size: 12px;
}

.profile-actions {
  margin-top: 0;
}

.profile-error {
  display: grid;
  gap: 12px;
  justify-items: start;
}

@media (max-width: 760px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}
</style>
