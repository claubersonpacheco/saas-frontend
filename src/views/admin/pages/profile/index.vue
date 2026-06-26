<template>
  <AdminLayout>
    <template #title>Meu perfil</template>

    <section class="panel narrow profile-panel">
      <div v-if="currentUser" class="profile-content">
        <UserProfile :user="currentUser" @update:photo="handlePhotoUpdate" />

        <form class="profile-form" @submit.prevent="saveProfile">
          <div class="form-row-grid profile-form-grid">
            <div class="form-label">
              <label for="name">Nome</label>
            </div>
            <div class="form-field">
              <input id="name" v-model="profileForm.name" type="text" required :disabled="saving" />
            </div>

            <div class="form-label">
              <label for="lastname">Sobrenome</label>
            </div>
            <div class="form-field">
              <input id="lastname" v-model="profileForm.lastname" type="text" :disabled="saving" />
            </div>

            <div class="form-label">
              <label for="username">Usuario</label>
            </div>
            <div class="form-field">
              <input id="username" v-model="profileForm.username" type="text" required :disabled="saving" />
            </div>

            <div class="form-label">
              <label for="email">E-mail</label>
            </div>
            <div class="form-field">
              <input
                id="email"
                v-model="profileForm.email"
                type="email"
                required
                :disabled="saving || !canEditEmail"
              />
              <p v-if="!canEditEmail" class="profile-help">Seu usuario nao tem permissao para alterar o e-mail.</p>
            </div>

            <div class="form-label">
              <span>Perfil de acesso</span>
            </div>
            <div class="form-field">
              <div class="profile-readonly">{{ currentUser.role?.name || 'sin rol' }}</div>
            </div>
          </div>

          <p v-if="saveError" class="alert error">{{ saveError }}</p>
          <p v-if="saveMessage" class="alert success">{{ saveMessage }}</p>

          <div class="form-actions profile-actions">
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? 'Salvando...' : 'Salvar perfil' }}
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
import { computed, reactive, ref, onMounted } from 'vue';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import UserProfile from '@/components/UserProfile.vue';
import { apiRequest } from '@/services/api';
import { hasPermission, isMaster } from '@/services/permissions';
import { authState, updateUser } from '@/stores/auth';
import type { User } from '@/types';

const error = ref(false);
const saving = ref(false);
const saveError = ref('');
const saveMessage = ref('');
const currentUser = ref<User | null>(authState.user);
const profileForm = reactive({
  name: '',
  lastname: '',
  username: '',
  email: '',
});
const canEditEmail = computed(() => isMaster() || hasPermission('user.email'));

function syncForm(user: User) {
  profileForm.name = user.name || '';
  profileForm.lastname = user.lastname || '';
  profileForm.username = user.username || '';
  profileForm.email = user.email || '';
}

const fetchProfile = async () => {
  error.value = false;
  try {
    const user = await apiRequest<User>('/auth/me');
    currentUser.value = user;
    syncForm(user);
    updateUser(user);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    error.value = true;
  }
};

const handlePhotoUpdate = (user: User) => {
  currentUser.value = user;
  syncForm(user);
  updateUser(user);
  saveMessage.value = 'Foto atualizada com sucesso.';
};

async function saveProfile() {
  if (!currentUser.value) {
    return;
  }

  saving.value = true;
  saveError.value = '';
  saveMessage.value = '';

  const body: Record<string, string> = {
    name: profileForm.name.trim(),
    username: profileForm.username.trim(),
  };
  const lastname = profileForm.lastname.trim();

  if (lastname) {
    body.lastname = lastname;
  }

  if (canEditEmail.value) {
    body.email = profileForm.email.trim();
  }

  try {
    const user = await apiRequest<User>(`/users/${currentUser.value.id}`, {
      method: 'PATCH',
      body,
    });
    currentUser.value = user;
    syncForm(user);
    updateUser(user);
    saveMessage.value = 'Perfil atualizado com sucesso.';
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (currentUser.value) {
    syncForm(currentUser.value);
  }

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
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
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
