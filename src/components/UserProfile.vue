<template>
  <div class="profile-photo">
    <div class="profile-photo-frame">
      <img
        v-if="photoSrc"
        :src="photoSrc"
        class="profile-photo-img"
        :class="{ 'is-uploading': busy }"
        alt="Foto do perfil"
      />
      <div
        v-else
        class="profile-photo-img profile-photo-initials"
        :class="{ 'is-uploading': busy }"
        aria-label="Foto do perfil"
      >
        {{ initials }}
      </div>
      <div v-if="busy" class="profile-photo-overlay">
        <LoaderCircle :size="18" class="spin" />
      </div>
    </div>

    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      accept="image/*"
      @change="handleFileUpload"
    />

    <div class="profile-photo-actions">
      <button type="button" class="secondary-button compact" :disabled="busy" @click="fileInput?.click()">
        <Camera :size="16" />
        <span>{{ uploading ? 'Enviando...' : 'Alterar foto' }}</span>
      </button>
      <button
        v-if="user.photoUrl"
        type="button"
        class="secondary-button compact danger-button"
        :disabled="busy"
        @click="removePhoto"
      >
        <Trash2 :size="16" />
        <span>{{ removing ? 'Excluindo...' : 'Excluir foto' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Camera, LoaderCircle, Trash2 } from '@lucide/vue';
import { computed, onBeforeUnmount, ref } from 'vue';
import { apiRequest } from '../services/api';
import type { User } from '../types';

const props = defineProps({
  user: {
    type: Object as () => User,
    required: true,
  },
});

const emit = defineEmits<{
  'update:photo': [user: User];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const uploading = ref(false);
const removing = ref(false);
const busy = computed(() => uploading.value || removing.value);
const photoSrc = computed(() => previewUrl.value || props.user.photoUrl || '');
const initials = computed(() => {
  const parts = [props.user.name, props.user.lastname]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];
  const source = parts.length ? parts : [props.user.username || props.user.email || 'U'];

  return source
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
});

function setPreview(file: File) {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
}

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Selecione um arquivo de imagem.');
    input.value = '';
    return;
  }

  setPreview(file);

  const formData = new FormData();
  formData.append('photo', file);

  try {
    uploading.value = true;
    const updatedUser = await apiRequest<User>(`/users/${props.user.id}/photo`, {
      method: 'POST',
      body: formData,
    });

    emit('update:photo', updatedUser);
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = null;
    alert('Foto atualizada com sucesso!');
  } catch (err) {
    console.error('Erro no upload:', err);
    alert(err instanceof Error ? err.message : 'Erro ao atualizar a foto.');
  } finally {
    uploading.value = false;
    input.value = '';
  }
};

async function removePhoto() {
  if (!props.user.photoUrl) {
    return;
  }

  try {
    removing.value = true;
    const updatedUser = await apiRequest<User>(`/users/${props.user.id}/photo`, {
      method: 'DELETE',
    });

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }

    emit('update:photo', updatedUser);
    alert('Foto excluida com sucesso!');
  } catch (err) {
    console.error('Erro ao excluir foto:', err);
    alert(err instanceof Error ? err.message : 'Erro ao excluir a foto.');
  } finally {
    removing.value = false;
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
.profile-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.profile-photo-frame {
  position: relative;
  width: 132px;
  height: 132px;
}

.profile-photo-img {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  border: 1px solid #dfe7e2;
  background: #f4f6f5;
  box-shadow: 0 10px 30px rgba(17, 38, 31, 0.08);
  transition: opacity 0.2s ease;
}

img.profile-photo-img {
  display: block;
  object-fit: cover;
}

.profile-photo-initials {
  display: grid;
  place-items: center;
  color: #0f3d31;
  font-size: 38px;
  font-weight: 750;
  background: linear-gradient(135deg, #e8f5ef, #f6faf8);
}

.profile-photo-actions {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.danger-button {
  color: #a0352f;
  border-color: #f0c9c5;
  background: #fff7f6;
}

.danger-button:hover:not(:disabled) {
  border-color: #e39b94;
  background: #fff0ee;
}

.is-uploading {
  opacity: 0.45;
}

.profile-photo-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #0c7c59;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
