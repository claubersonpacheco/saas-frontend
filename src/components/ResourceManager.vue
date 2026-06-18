<script setup lang="ts">
import { ChevronLeft, ChevronRight, ClipboardList, Copy, Edit3, MapPin, Plus, RefreshCw, Save, Trash2, X } from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { apiRequest } from '../services/api';
import { canGenerateCode, generateCode } from '../services/codeGenerator';
import { getValue, type ResourceConfig, type ResourceField } from '../resources';

const props = defineProps<{
  config: ResourceConfig;
  fixedFilters?: Record<string, string | number>;
  fixedValues?: Record<string, string | number>;
  hiddenFormFields?: string[];
  hideEditor?: boolean;
  totalFields?: Array<{ key: string; label: string }>;
}>();

const items = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const message = ref('');
const editing = ref<Record<string, unknown> | null>(null);
const form = reactive<Record<string, unknown>>({});
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const filterYear = ref('');
const filterMonth = ref('');
const filterWeek = ref('');
const productTypeFilter = ref('');
const productCategoryFilter = ref('');
const codePrefix = ref('FS');
const categoryOptions = ref<Array<{ value: number; label: string }>>([]);

const months = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const showEditor = computed(() => !props.hideEditor && (!props.config.createPath || Boolean(editing.value)));
const showServiceFilters = computed(() => props.config.key === 'services');
const showProductFilters = computed(() => props.config.key === 'products');
const formTitle = computed(() => (editing.value ? 'Editar registro' : 'Nuevo registro'));
const scopedItems = computed(() => {
  const entries = Object.entries(props.fixedFilters || {});

  if (!entries.length) {
    return items.value;
  }

  return items.value.filter((item) =>
    entries.every(([key, value]) => String(item[key] ?? '') === String(value)),
  );
});
const filteredItems = computed(() => {
  if (showProductFilters.value) {
    const term = normalizeSearch(search.value);

    return scopedItems.value.filter((item) => {
      const category = item.category as { id?: number; name?: string } | null | undefined;
      const searchable = [
        item.code,
        item.name,
        item.productType,
        category?.name,
      ]
        .map((value) => normalizeSearch(value))
        .join(' ');

      if (term && !searchable.includes(term)) {
        return false;
      }

      if (productTypeFilter.value && String(item.productType || '') !== productTypeFilter.value) {
        return false;
      }

      if (productCategoryFilter.value && String(category?.id ?? item.categoryId ?? '') !== productCategoryFilter.value) {
        return false;
      }

      return true;
    });
  }

  if (!showServiceFilters.value) {
    return scopedItems.value;
  }

  const term = normalizeSearch(search.value);

  return scopedItems.value.filter((item) => {
    const date = String(item.dateStart || '');
    const dateYear = date.slice(0, 4);
    const dateMonth = date.slice(5, 7);
    const searchable = [
      item.code,
      getValue(item, 'fullAddress'),
      item.description,
      getValue(item, 'user'),
    ]
      .map((value) => normalizeSearch(value))
      .join(' ');

    if (term && !searchable.includes(term)) {
      return false;
    }

    if (filterYear.value && dateYear !== filterYear.value) {
      return false;
    }

    if (filterMonth.value && dateMonth !== filterMonth.value) {
      return false;
    }

    if (filterWeek.value && serviceWeek(date) !== filterWeek.value) {
      return false;
    }

    return true;
  });
});
const sortedItems = computed(() => {
  if (!showServiceFilters.value) {
    return filteredItems.value;
  }

  return [...filteredItems.value].sort(compareServicesBySchedule);
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));
const paginatedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return sortedItems.value.slice(start, start + pageSize.value);
});
const serviceYears = computed(() => {
  const years = items.value
    .map((item) => String(item.dateStart || '').slice(0, 4))
    .filter((year) => /^\d{4}$/.test(year));

  return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
});
const totalServices = computed(() => items.value.length);
const filteredServices = computed(() => filteredItems.value.length);
const openServices = computed(() => filteredItems.value.filter((item) => Number(item.status) === 2).length);
const closedServices = computed(() => filteredItems.value.filter((item) => Number(item.status) === 0).length);
const totalFieldValues = computed(() =>
  (props.totalFields || []).map((field) => ({
    ...field,
    value: filteredItems.value.reduce((sum, item) => sum + Number(item[field.key] || 0), 0),
  })),
);
const productTypeOptions = computed(() => {
  const field = props.config.fields.find((item) => item.key === 'productType');

  return field?.options || [];
});

function columnLabel(column: string) {
  return props.config.columnLabels?.[column] || column;
}

function isLogoColumn(column: string) {
  return ['logo', 'logoIcon', 'logoPrint', 'logoWhite'].includes(column);
}

function logoValue(item: Record<string, unknown>, column: string) {
  const value = getValue(item, column);
  return typeof value === 'string' ? value : '';
}

function isUserPhotoColumn(column: string) {
  return props.config.key === 'users' && column === 'photoUrl';
}

function userPhotoValue(item: Record<string, unknown>) {
  const value = item.photoUrl;
  return typeof value === 'string' ? value : '';
}

function userInitials(item: Record<string, unknown>) {
  const parts = [item.name, item.lastname]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const source = parts.length
    ? parts
    : [String(item.username || item.email || 'U').trim()];

  return source
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function isServiceCodeColumn(column: string) {
  return props.config.key === 'services' && column === 'code';
}

function isServiceAddressColumn(column: string) {
  return props.config.key === 'services' && column === 'fullAddress';
}

function serviceCode(item: Record<string, unknown>) {
  return String(item.code || '');
}

function serviceAddress(item: Record<string, unknown>) {
  return getValue(item, 'fullAddress');
}

function serviceMapsUrl(item: Record<string, unknown>) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceAddress(item))}`;
}

async function copyServiceCode(item: Record<string, unknown>) {
  const code = serviceCode(item);

  if (!code) {
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    message.value = 'Código del servicio copiado.';
    error.value = '';
  } catch {
    error.value = 'No se pudo copiar el código.';
  }
}

function editPath(item: Record<string, unknown>) {
  if (!props.config.editPath || !item.id) {
    return '';
  }

  const routeId = props.config.key === 'users' && item.uuid ? item.uuid : item.id;

  return props.config.editPath(String(routeId));
}

function budgetItemsPath(item: Record<string, unknown>) {
  return item.id ? `/budgets/${item.id}/items` : '';
}

function isFormFieldVisible(field: ResourceField) {
  return !props.hiddenFormFields?.includes(field.key);
}

function rowKey(item: Record<string, unknown>, index: number) {
  return String(item.id ?? `${props.config.key}-${index}`);
}

function normalizeSearch(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function serviceWeek(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function serviceDateKey(item: Record<string, unknown>) {
  return String(item.dateStart || '').slice(0, 10);
}

function serviceScheduleTime(item: Record<string, unknown>) {
  const time = String(item.hourStart || '').trim();

  return time ? time.slice(0, 5) : '99:99';
}

function compareServicesBySchedule(first: Record<string, unknown>, second: Record<string, unknown>) {
  const dateComparison = serviceDateKey(first).localeCompare(serviceDateKey(second));

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const timeComparison = serviceScheduleTime(first).localeCompare(serviceScheduleTime(second));

  return timeComparison !== 0 ? timeComparison : Number(first.id || 0) - Number(second.id || 0);
}

function clearDateFilters() {
  filterYear.value = '';
  filterMonth.value = '';
  filterWeek.value = '';
}

function clearProductFilters() {
  search.value = '';
  productTypeFilter.value = '';
  productCategoryFilter.value = '';
}

function hasFieldOptions(field: ResourceField) {
  return Boolean(field.options?.length || fieldOptions(field).length);
}

function fieldOptions(field: ResourceField) {
  if (props.config.key === 'products' && field.key === 'categoryId') {
    return categoryOptions.value;
  }

  return field.options || [];
}

function previousPage() {
  page.value = Math.max(1, page.value - 1);
}

function nextPage() {
  page.value = Math.min(totalPages.value, page.value + 1);
}

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);

  props.config.fields.forEach((field) => {
    form[field.key] =
      field.defaultValue ?? (field.type === 'boolean' ? true : field.type === 'multiselect' ? [] : '');
  });

  Object.assign(form, props.fixedValues || {});
  editing.value = null;
  fillGeneratedCode();
}

function fillGeneratedCode() {
  if (!canGenerateCode(props.config.key) || !props.config.fields.some((field) => field.key === 'code')) {
    return;
  }

  form.code = generateCode(props.config.key, items.value, codePrefix.value);
}

async function loadCodePrefix() {
  codePrefix.value = 'FS';

  if (!canGenerateCode(props.config.key)) {
    return;
  }

  try {
    const settings = await apiRequest<Array<Record<string, unknown>>>('/settings');
    const prefix = String(settings[0]?.prefix || '').trim();
    codePrefix.value = prefix || 'FS';
  } catch {
    codePrefix.value = 'FS';
  }
}

async function loadCategoryOptions() {
  categoryOptions.value = [];

  if (props.config.key !== 'products') {
    return;
  }

  try {
    const categories = await apiRequest<Array<Record<string, unknown>>>('/categories');
    categoryOptions.value = categories.map((category) => ({
      value: Number(category.id),
      label: String(category.name || category.id),
    }));
  } catch {
    categoryOptions.value = [];
  }
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

  if (field.type === 'multiselect') {
    return Array.isArray(value) ? value : [];
  }

  if (field.type === 'boolean') {
    return Boolean(value);
  }

  return value === '' ? undefined : value;
}

function payload() {
  const body = props.config.fields.reduce<Record<string, unknown>>((draft, field) => {
    if (editing.value && field.createOnly) {
      return draft;
    }

    const value = normalizeValue(field, form[field.key]);

    if (value !== undefined) {
      draft[field.key] = value;
    }

    return draft;
  }, {});

  Object.assign(body, props.fixedValues || {});

  if (props.config.key === 'plans') {
    body.projectType = 'micontrol';
  }

  return body;
}

async function load() {
  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    items.value = await apiRequest<Record<string, unknown>[]>(props.config.endpoint);
    page.value = 1;
    if (!editing.value) {
      Object.assign(form, props.fixedValues || {});
      fillGeneratedCode();
    }
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

    if (field.key === 'categoryId') {
      form[field.key] = current ?? (item.category as { id?: number } | undefined)?.id ?? '';
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

    if (field.type === 'multiselect') {
      form[field.key] = Array.isArray(current) ? current : [];
      return;
    }

    form[field.key] = current ?? (field.type === 'boolean' ? true : '');
  });

  Object.assign(form, props.fixedValues || {});
}

function formArray(key: string) {
  return Array.isArray(form[key]) ? (form[key] as Array<string | number>) : [];
}

function updateFormArray(key: string, value: string | number, checked: boolean) {
  const current = formArray(key);

  form[key] = checked
    ? [...current, value]
    : current.filter((item) => String(item) !== String(value));
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
  async () => {
    search.value = '';
    clearDateFilters();
    clearProductFilters();
    pageSize.value = 10;
    await loadCodePrefix();
    await loadCategoryOptions();
    resetForm();
    load();
  },
);

watch([search, filterYear, filterMonth, filterWeek, productTypeFilter, productCategoryFilter, pageSize], () => {
  page.value = 1;
});

watch(filterYear, (year) => {
  if (!year) {
    filterMonth.value = '';
    filterWeek.value = '';
  }
});

onMounted(async () => {
  await loadCodePrefix();
  await loadCategoryOptions();
  resetForm();
  load();
});
</script>

<template>
  <section class="resource-layout">
    <div class="resource-table-card">
      <div class="resource-table-scroll">
        <div class="resource-table-inner">
          <div class="resource-table-shell">
            <div class="resource-table-header">
              <div>
                <h2>{{ config.title }}</h2>
                <p>Administre registros, cree nuevos elementos y actualice la información.</p>
              </div>

              <div class="resource-table-actions">
                <button class="secondary-button compact" type="button" title="Actualizar" @click="load">
                  <RefreshCw :size="17" />
                  Actualizar
                </button>
                <RouterLink v-if="config.createPath" class="primary-button compact" :to="config.createPath">
                  <Plus :size="18" />
                  Crear
                </RouterLink>
              </div>
            </div>

            <div v-if="showServiceFilters" class="service-filter-summary">
              <div class="service-stat">
                <span>Total de servicios</span>
                <strong>{{ totalServices }}</strong>
              </div>
              <div class="service-stat">
                <span>Servicios filtrados</span>
                <strong>{{ filteredServices }}</strong>
              </div>
              <div class="service-stat">
                <span>Abiertos</span>
                <strong>{{ openServices }}</strong>
              </div>
              <div class="service-stat">
                <span>Cerrados</span>
                <strong>{{ closedServices }}</strong>
              </div>
              <label class="service-filter-field">
                <span>Por página</span>
                <select v-model.number="pageSize">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                </select>
              </label>
            </div>

            <div v-if="showServiceFilters" class="service-filter-panel">
              <label class="service-filter-field wide">
                <span>Buscar servicio</span>
                <input
                  v-model="search"
                  type="search"
                  placeholder="Busque por código, dirección, descripción o responsable"
                />
              </label>

              <label class="service-filter-field">
                <span>Año</span>
                <select v-model="filterYear">
                  <option value="">Todos</option>
                  <option v-for="year in serviceYears" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </label>

              <label class="service-filter-field">
                <span>Mes</span>
                <select v-model="filterMonth" :disabled="!filterYear">
                  <option value="">Todos</option>
                  <option v-for="month in months" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </label>

              <div class="service-week-filter">
                <label class="service-filter-field">
                  <span>Semana</span>
                  <input v-model="filterWeek" type="week" :disabled="!filterYear" />
                </label>

                <button type="button" class="secondary-button compact" @click="clearDateFilters">
                  Limpiar
                </button>
              </div>
            </div>

            <div v-if="showProductFilters" class="service-filter-panel">
              <label class="service-filter-field wide">
                <span>Buscar producto</span>
                <input
                  v-model="search"
                  type="search"
                  placeholder="Busque por código, nombre, tipo o categoría"
                />
              </label>

              <label class="service-filter-field">
                <span>Tipo</span>
                <select v-model="productTypeFilter">
                  <option value="">Todos</option>
                  <option v-for="option in productTypeOptions" :key="option.value" :value="String(option.value)">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label class="service-filter-field">
                <span>Categoría</span>
                <select v-model="productCategoryFilter">
                  <option value="">Todas</option>
                  <option v-for="option in categoryOptions" :key="option.value" :value="String(option.value)">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <div class="service-week-filter">
                <button type="button" class="secondary-button compact" @click="clearProductFilters">
                  Limpiar
                </button>
              </div>
            </div>

            <div v-if="message || error" class="resource-table-feedback mb-5">
              <p v-if="message" class="alert success">{{ message }}</p>
              <p v-if="error" class="alert error">{{ error }}</p>
            </div>

            <table class="resource-table">
              <thead>
                <tr>
                  <th v-for="column in config.columns" :key="column" scope="col">
                    <span>{{ columnLabel(column) }}</span>
                  </th>
                  <th scope="col" class="resource-table-action-col"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td :colspan="config.columns.length + 1">
                    <span class="resource-table-muted">Cargando...</span>
                  </td>
                </tr>
                <tr v-else-if="!filteredItems.length">
                  <td :colspan="config.columns.length + 1">
                    <span class="resource-table-muted">No se encontraron registros.</span>
                  </td>
                </tr>
                <tr v-for="(item, index) in paginatedItems" v-else :key="rowKey(item, index)">
                  <td v-for="column in config.columns" :key="column">
                    <span v-if="isLogoColumn(column) && logoValue(item, column)" class="resource-table-logo">
                      <img :src="logoValue(item, column)" :alt="columnLabel(column)" />
                    </span>
                    <span v-else-if="isLogoColumn(column)" class="resource-table-muted">Sin logo</span>
                    <span v-else-if="isUserPhotoColumn(column)" class="resource-table-avatar">
                      <img v-if="userPhotoValue(item)" :src="userPhotoValue(item)" :alt="getValue(item, 'name')" />
                      <span v-else>{{ userInitials(item) }}</span>
                    </span>
                    <span v-else-if="isServiceCodeColumn(column)" class="service-code-cell">
                      <span>{{ serviceCode(item) }}</span>
                      <button
                        class="resource-table-icon compact-icon"
                        type="button"
                        title="Copiar código"
                        aria-label="Copiar código"
                        @click="copyServiceCode(item)"
                      >
                        <Copy :size="15" />
                      </button>
                    </span>
                    <a
                      v-else-if="isServiceAddressColumn(column) && serviceAddress(item) !== '-'"
                      class="service-map-link"
                      :href="serviceMapsUrl(item)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir en Google Maps"
                    >
                      <MapPin :size="15" />
                      <span>{{ serviceAddress(item) }}</span>
                    </a>
                    <span v-else>{{ getValue(item, column) }}</span>
                  </td>
                  <td>
                    <div class="resource-row-actions">
                      <RouterLink
                        v-if="config.editPath"
                        class="resource-table-icon"
                        :to="editPath(item)"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Edit3 :size="16" />
                      </RouterLink>
                      <button
                        v-else-if="!props.hideEditor"
                        class="resource-table-icon"
                        type="button"
                        title="Editar"
                        aria-label="Editar"
                        @click="edit(item)"
                      >
                        <Edit3 :size="16" />
                      </button>
                      <RouterLink
                        v-if="config.key === 'budgets'"
                        class="resource-table-icon"
                        :to="budgetItemsPath(item)"
                        title="Items presupuesto"
                        aria-label="Items presupuesto"
                      >
                        <ClipboardList :size="16" />
                      </RouterLink>
                      <button
                        class="resource-table-icon danger"
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar"
                        @click="remove(item)"
                      >
                        <Trash2 :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="resource-table-footer">
              <p>
                <strong>{{ filteredItems.length }}</strong>
                {{ filteredItems.length === 1 ? 'resultado' : 'resultados' }}
              </p>

              <div v-if="totalFieldValues.length" class="resource-total-row">
                <div v-for="field in totalFieldValues" :key="field.key" class="resource-total-item">
                  <span>{{ field.label }}</span>
                  <strong>{{ field.value.toFixed(2) }}</strong>
                </div>
              </div>

              <div class="resource-pagination">
                <button type="button" :disabled="page <= 1" @click="previousPage">
                  <ChevronLeft :size="16" />
                  Anterior
                </button>
                <span>{{ page }} / {{ totalPages }}</span>
                <button type="button" :disabled="page >= totalPages" @click="nextPage">
                  Siguiente
                  <ChevronRight :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <label v-if="isFormFieldVisible(field) && (!editing || !field.createOnly)">
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
            <div v-else-if="field.type === 'multiselect'" class="check-grid compact">
              <label v-for="option in field.options" :key="option.value" class="check-option">
                <input
                  type="checkbox"
                  :value="option.value"
                  :checked="formArray(field.key).some((item) => String(item) === String(option.value))"
                  @change="updateFormArray(field.key, option.value, ($event.target as HTMLInputElement).checked)"
                />
                <span>
                  <strong>{{ option.label }}</strong>
                </span>
              </label>
            </div>
            <select
              v-else-if="hasFieldOptions(field)"
              v-model="form[field.key] as string"
              :required="field.required"
            >
              <option value="">Seleccione...</option>
              <option v-for="option in fieldOptions(field)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
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
