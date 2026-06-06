<script setup lang="ts">
import { Edit3, Plus, RefreshCw, Save, Trash2, X } from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { apiRequest } from '../services/api';
import { getValue, type ResourceConfig, type ResourceField } from '../resources';

const props = defineProps<{
  config: ResourceConfig;
}>();

const items = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const message = ref('');
const editing = ref<Record<string, unknown> | null>(null);
const form = reactive<Record<string, unknown>>({});

const showEditor = computed(() => !props.config.createPath || Boolean(editing.value));
const formTitle = computed(() => (editing.value ? 'Editar registro' : 'Nuevo registro'));

function columnLabel(column: string) {
  return props.config.columnLabels?.[column] || column;
}

function editPath(item: Record<string, unknown>) {
  if (!props.config.editPath || !item.id) {
    return '';
  }

  return props.config.editPath(String(item.id));
}

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);

  props.config.fields.forEach((field) => {
    form[field.key] = field.type === 'boolean' ? true : '';
  });

  editing.value = null;
}

function normalizeValue(field: ResourceField, value: unknown) {
  if (field.type === 'number') {
    return value === '' || value == null ? undefined : Number(value);
  }

  if (field.type === 'csv') {
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (field.key.endsWith('Ids') ? Number(item) : item));
  }

  if (field.type === 'boolean') {
    return Boolean(value);
  }

  return value === '' ? undefined : value;
}

function payload() {
  return props.config.fields.reduce<Record<string, unknown>>((body, field) => {
    if (editing.value && field.createOnly) {
      return body;
    }

    const value = normalizeValue(field, form[field.key]);

    if (value !== undefined) {
      body[field.key] = value;
    }

    return body;
  }, {});
}

async function load() {
  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    items.value = await apiRequest<Record<string, unknown>[]>(props.config.endpoint);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar.';
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function edit(item: Record<string, unknown>) {
  editing.value = item;
  props.config.fields.forEach((field) => {
    const current = item[field.key];

    if (field.key === 'roleId') {
      form[field.key] = (item.role as { id?: number } | undefined)?.id || '';
      return;
    }

    if (field.key === 'permissionIds') {
      form[field.key] = ((item.permissions as Array<{ id: number }> | undefined) || [])
        .map((permission) => permission.id)
        .join(',');
      return;
    }

    if (field.type === 'csv') {
      form[field.key] = Array.isArray(current) ? current.join(',') : '';
      return;
    }

    form[field.key] = current ?? (field.type === 'boolean' ? true : '');
  });
}

async function save() {
  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    if (editing.value?.id) {
      await apiRequest(`${props.config.endpoint}/${editing.value.id}`, {
        method: 'PATCH',
        body: payload(),
      });
      message.value = 'Registro actualizado.';
    } else {
      await apiRequest(props.config.endpoint, {
        method: 'POST',
        body: payload(),
      });
      message.value = 'Registro creado.';
    }

    resetForm();
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar.';
  } finally {
    saving.value = false;
  }
}

async function remove(item: Record<string, unknown>) {
  const id = item.id;

  if (!id || !window.confirm(`¿Eliminar registro #${id}?`)) {
    return;
  }

  error.value = '';
  message.value = '';

  try {
    await apiRequest(`${props.config.endpoint}/${id}`, { method: 'DELETE' });
    message.value = 'Registro eliminado.';
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo eliminar.';
  }
}

watch(
  () => props.config.key,
  () => {
    resetForm();
    load();
  },
);

onMounted(() => {
  resetForm();
  load();
});
</script>

<template>
  <section class="resource-layout">
    <div class="panel table-panel">
      <div class="panel-title">
        <component :is="config.icon" :size="20" />
        <h2>{{ config.title }}</h2>
        <button class="icon-button" type="button" title="Actualizar" @click="load">
          <RefreshCw :size="17" />
        </button>
        <RouterLink v-if="config.createPath" class="primary-button compact" :to="config.createPath">
          <Plus :size="18" />
          Crear
        </RouterLink>
      </div>

      <p v-if="message" class="alert success">{{ message }}</p>
      <p v-if="error" class="alert error">{{ error }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in config.columns" :key="column">{{ columnLabel(column) }}</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="config.columns.length + 1">Cargando...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td :colspan="config.columns.length + 1">No se encontraron registros.</td>
            </tr>
            <tr v-for="item in items" v-else :key="String(item.id)">
              <td v-for="column in config.columns" :key="column">{{ getValue(item, column) }}</td>
              <td class="row-actions">
                <RouterLink v-if="config.editPath" class="icon-button" :to="editPath(item)" title="Editar">
                  <Edit3 :size="16" />
                </RouterLink>
                <button v-else class="icon-button" type="button" title="Editar" @click="edit(item)">
                  <Edit3 :size="16" />
                </button>
                <button class="icon-button danger" type="button" title="Eliminar" @click="remove(item)">
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <aside v-if="showEditor" class="panel editor-panel">
      <div class="panel-title">
        <Plus v-if="!editing" :size="20" />
        <Edit3 v-else :size="20" />
        <h2>{{ formTitle }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="save">
        <template v-for="field in config.fields" :key="field.key">
          <label v-if="!editing || !field.createOnly">
            {{ field.label }}
            <textarea
              v-if="field.type === 'textarea'"
              v-model="form[field.key] as string"
              :placeholder="field.placeholder"
              :required="field.required"
            />
            <span v-else-if="field.type === 'boolean'" class="switch-row">
              <input v-model="form[field.key] as boolean" type="checkbox" />
              <span>{{ form[field.key] ? 'Activo' : 'Inactivo' }}</span>
            </span>
            <input
              v-else
              v-model="form[field.key] as string"
              :type="field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'"
              :placeholder="field.placeholder"
              :required="field.required"
            />
          </label>
        </template>

        <div class="button-row">
          <button class="primary-button" type="submit" :disabled="saving">
            <Save :size="18" />
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button v-if="editing" class="secondary-button" type="button" @click="resetForm">
            <X :size="18" />
            Cancelar
          </button>
        </div>
      </form>
    </aside>
  </section>
</template>
