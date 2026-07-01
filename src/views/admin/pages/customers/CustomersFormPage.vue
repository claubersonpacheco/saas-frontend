<script setup lang="ts">
import { ArrowLeft, Save, Search, Upload, X } from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import { apiRequest } from '@/services/api';
import { canGenerateCode, generateCode } from '@/services/codeGenerator';
import { hasPermission } from '@/services/permissions';
import { resources, type ResourceField } from '@/resources';
import type { Plan, User } from '@/types';

const RESOURCE_KEY = 'customers';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingRecord = ref(false);
const loadingPlans = ref(false);
const loadingCustomers = ref(false);
const loadingServiceUsers = ref(false);
const loadingTenantAdmin = ref(false);
const savingTenantAdminPassword = ref(false);
const error = ref('');
const tenantAdminError = ref('');
const tenantAdminMessage = ref('');
const form = reactive<Record<string, unknown>>({});
const tenantAdminPassword = ref('');
const plans = ref<Plan[]>([]);
const tenantAdmin = ref<User | null>(null);
const codePrefix = ref('FS');
const categoryOptions = ref<Array<{ value: number; label: string }>>([]);
const customerOptions = ref<Array<{ value: number; label: string }>>([]);
const serviceUserOptions = ref<Array<{ value: number; label: string }>>([]);
const customerSearch = ref('');
const customerModalOpen = ref(false);
const activeSettingsTab = ref('identity');
const selectedLogoFiles = reactive<Record<string, File | null>>({
  logo: null,
  logoIcon: null,
  logoPrint: null,
  logoWhite: null,
});
const selectedLogoPreviewUrls = reactive<Record<string, string>>({});

const config = computed(() => resources[RESOURCE_KEY]);
const recordId = computed(() => String(route.params.id || ''));
const isEditing = computed(() => Boolean(recordId.value));
const title = computed(() => `${isEditing.value ? 'Editar' : 'Nuevo'} ${config.value.title.toLowerCase()}`);
const returnPath = computed(() => {
  const value = Array.isArray(route.query.returnTo) ? route.query.returnTo[0] : route.query.returnTo;

  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : config.value.endpoint;
});
const visibleFields = computed(() =>
  config.value.fields.filter((field) => (isEditing.value ? !field.hideOnEdit : !field.hideOnCreate)),
);
const settingsTabs = [
  {
    key: 'identity',
    label: 'Identidad',
    fields: ['name', 'prefix', 'logo', 'logoIcon', 'logoPrint', 'logoWhite'],
  },
];
const CURRENT_DATE_FIELD_KEYS = new Set(['date', 'dateStart', 'dateEnd', 'fechaEmision']);
const isSettingsForm = computed(() => config.value.key === 'settings');
const settingsFieldsByTab = computed(() =>
  settingsTabs.map((tab) => ({
    ...tab,
    fields: visibleFields.value.filter((field) => tab.fields.includes(field.key)),
  })),
);
const currentVisibleFields = computed(() => {
  if (!isSettingsForm.value) {
    return visibleFields.value;
  }

  return settingsFieldsByTab.value.find((tab) => tab.key === activeSettingsTab.value)?.fields || [];
});
const filteredCustomerOptions = computed(() => {
  const search = customerSearch.value.trim().toLowerCase();
  const selectedCustomerId = String(form.customerId || '');

  if (!search) {
    return customerOptions.value;
  }

  return customerOptions.value.filter(
    (option) => option.label.toLowerCase().includes(search) || String(option.value) === selectedCustomerId,
  );
});
const selectedCustomerLabel = computed(() => {
  const selectedCustomerId = String(form.customerId || '');

  return customerOptions.value.find((option) => String(option.value) === selectedCustomerId)?.label || '';
});
const customerSelectSize = computed(() => {
  if (!customerSearch.value.trim()) {
    return 1;
  }

  return Math.min(Math.max(filteredCustomerOptions.value.length + 1, 2), 7);
});

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(dateValue: string, daysValue: unknown) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const days = Number(daysValue || 0);

  date.setDate(date.getDate() + (Number.isFinite(days) ? days : 0));

  return formatDateInput(date);
}

function setBudgetDefaultDates() {
  if (config.value.key !== 'budgets' || isEditing.value) {
    return;
  }

  form.date = formatDateInput(new Date());
  form.expirate = addDays(String(form.date), form.totalExpirate);
}

function updateBudgetExpiration(key: string) {
  if (config.value.key !== 'budgets' || !['date', 'totalExpirate'].includes(key)) {
    return;
  }

  form.expirate = addDays(String(form.date || ''), form.totalExpirate);
}

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);

  config.value.fields.forEach((field) => {
    form[field.key] =
      field.defaultValue ??
      (field.type === 'date' && CURRENT_DATE_FIELD_KEYS.has(field.key)
        ? formatDateInput(new Date())
        : field.type === 'boolean'
          ? true
          : field.type === 'multiselect'
            ? []
            : '');
  });

  setBudgetDefaultDates();
}

async function loadGeneratedCode() {
  if (
    isEditing.value ||
    !canGenerateCode(config.value.key) ||
    !config.value.fields.some((field) => field.key === 'code')
  ) {
    return;
  }

  try {
    const items = await apiRequest<Array<Record<string, unknown>>>(config.value.endpoint);
    form.code = generateCode(config.value.key, items, codePrefix.value);
  } catch {
    form.code = generateCode(config.value.key, [], codePrefix.value);
  }
}

async function loadCodePrefix() {
  codePrefix.value = 'FS';

  if (!canGenerateCode(config.value.key)) {
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

function normalizeValue(field: ResourceField, value: unknown) {
  if (config.value.key === 'tenants' && field.key === 'planId') {
    return value === '' || value == null ? null : Number(value);
  }

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

function setFieldValue(field: ResourceField, record: Record<string, unknown>) {
  const value = record[field.key];

  if (field.type === 'csv') {
    form[field.key] = Array.isArray(value) ? value.join(',') : '';
    return;
  }

  if (field.type === 'multiselect') {
    form[field.key] = Array.isArray(value) ? value : [];
    return;
  }

  if (field.key === 'categoryId') {
    form[field.key] = value ?? (record.category as { id?: number } | undefined)?.id ?? '';
    return;
  }

  if (field.key === 'customerId') {
    form[field.key] = value ?? (record.customer as { id?: number } | undefined)?.id ?? '';
    return;
  }

  if (field.key === 'userId') {
    form[field.key] = value ?? (record.user as { id?: number } | undefined)?.id ?? '';
    return;
  }

  form[field.key] = value ?? (field.type === 'boolean' ? true : '');
}

function fieldText(key: string) {
  const value = form[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function fieldBoolean(key: string) {
  return Boolean(form[key]);
}

function fieldArray(key: string) {
  return Array.isArray(form[key]) ? (form[key] as Array<string | number>) : [];
}

function isSettingsLogoField(field: ResourceField) {
  return config.value.key === 'settings' && ['logo', 'logoIcon', 'logoPrint', 'logoWhite'].includes(field.key);
}

function logoPreviewSrc(key: string) {
  return selectedLogoPreviewUrls[key] || fieldText(key);
}

function revokeLogoPreviewUrl(key: string) {
  if (selectedLogoPreviewUrls[key]) {
    URL.revokeObjectURL(selectedLogoPreviewUrls[key]);
    delete selectedLogoPreviewUrls[key];
  }
}

function logoUploadPath(recordIdValue: string | number, fieldKey: string) {
  const variantByField: Record<string, string> = {
    logoIcon: 'icon',
    logoPrint: 'print',
    logoWhite: 'white',
  };
  const variant = variantByField[fieldKey];

  return variant
    ? `${config.value.endpoint}/${recordIdValue}/logos/${variant}`
    : `${config.value.endpoint}/${recordIdValue}/logo`;
}

function updateLogoFile(key: string, event: Event) {
  const [file] = Array.from((event.target as HTMLInputElement).files || []);
  revokeLogoPreviewUrl(key);
  selectedLogoFiles[key] = file || null;

  if (file) {
    selectedLogoPreviewUrls[key] = URL.createObjectURL(file);
  }
}

async function uploadSelectedLogoFiles(recordIdValue: string | number) {
  if (config.value.key !== 'settings') {
    return;
  }

  for (const [fieldKey, file] of Object.entries(selectedLogoFiles)) {
    if (!file) {
      continue;
    }

    const body = new FormData();
    body.append('logo', file);

    const updatedSetting = await apiRequest<Record<string, unknown>>(logoUploadPath(recordIdValue, fieldKey), {
      method: 'POST',
      body,
    });

    config.value.fields.forEach((field) => setFieldValue(field, updatedSetting));
    selectedLogoFiles[fieldKey] = null;
    revokeLogoPreviewUrl(fieldKey);
  }
}

function hasFieldOptions(field: ResourceField) {
  if (config.value.key === 'budgets' && field.key === 'customerId') {
    return true;
  }

  if (config.value.key === 'services' && field.key === 'userId') {
    return true;
  }

  return Boolean(field.options?.length || fieldOptions(field).length);
}

function openCustomerModal() {
  customerSearch.value = '';
  customerModalOpen.value = true;
}

function closeCustomerModal() {
  customerModalOpen.value = false;
}

function selectCustomer(value: string | number) {
  form.customerId = value;
  closeCustomerModal();
}

function selectCustomerFromEvent(event: Event) {
  selectCustomer((event.target as HTMLSelectElement).value);
}

function updateText(key: string, event: Event) {
  const previousDateStart = form.dateStart;

  form[key] = (event.target as HTMLInputElement | HTMLTextAreaElement).value;

  if (
    config.value.key === 'services' &&
    key === 'dateStart' &&
    !isEditing.value &&
    (!form.dateEnd || form.dateEnd === previousDateStart)
  ) {
    form.dateEnd = form.dateStart;
  }

  updateBudgetExpiration(key);
}

function updateBoolean(key: string, event: Event) {
  form[key] = (event.target as HTMLInputElement).checked;
}

function updateArray(key: string, value: string | number, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  const current = fieldArray(key);

  form[key] = checked
    ? [...current, value]
    : current.filter((item) => String(item) !== String(value));
}

function fieldOptions(field: ResourceField) {
  if (config.value.key === 'tenants' && field.key === 'planId') {
    return plans.value.map((plan) => ({
      value: plan.id,
      label: plan.name,
    }));
  }

  if (config.value.key === 'products' && field.key === 'categoryId') {
    return categoryOptions.value;
  }

  if (config.value.key === 'budgets' && field.key === 'customerId') {
    return filteredCustomerOptions.value;
  }

  if (config.value.key === 'services' && field.key === 'userId') {
    return serviceUserOptions.value;
  }

  return field.options || [];
}

function serviceUserLabel(user: Record<string, unknown>) {
  const fullName = [user.name, user.lastname].filter(Boolean).join(' ').trim();

  return [fullName || user.username, user.email].filter(Boolean).join(' - ') || String(user.id);
}

function isMasterUserOption(user: Record<string, unknown>) {
  const role = user.role as { name?: unknown } | null | undefined;

  return String(role?.name || '').trim().toLowerCase() === 'master';
}

async function loadCustomerOptions() {
  customerOptions.value = [];
  customerSearch.value = '';

  if (config.value.key !== 'budgets') {
    return;
  }

  loadingCustomers.value = true;

  try {
    const customers = await apiRequest<Array<Record<string, unknown>>>('/customers');
    customerOptions.value = customers.map((customer) => ({
      value: Number(customer.id),
      label: [customer.name, customer.email, customer.phone].filter(Boolean).join(' - ') || String(customer.id),
    }));
  } catch {
    customerOptions.value = [];
  } finally {
    loadingCustomers.value = false;
  }
}

async function loadServiceUserOptions() {
  serviceUserOptions.value = [];

  if (config.value.key !== 'services') {
    return;
  }

  loadingServiceUsers.value = true;

  try {
    const [serviceUsers, allUsers] = await Promise.all([
      apiRequest<Array<Record<string, unknown>>>('/services/users/options').catch(() => []),
      hasPermission('users.read')
        ? apiRequest<Array<Record<string, unknown>>>('/users').catch(() => [])
        : Promise.resolve([]),
    ]);
    const usersById = new Map<number, Record<string, unknown>>();

    [...serviceUsers, ...allUsers].filter((user) => !isMasterUserOption(user)).forEach((user) => {
      const id = Number(user.id);

      if (Number.isFinite(id)) {
        usersById.set(id, user);
      }
    });

    serviceUserOptions.value = Array.from(usersById.values()).map((user) => ({
      value: Number(user.id),
      label: serviceUserLabel(user),
    }));
  } catch {
    serviceUserOptions.value = [];
  } finally {
    loadingServiceUsers.value = false;
  }
}

function payload() {
  const body = config.value.fields.reduce<Record<string, unknown>>((draft, field) => {
    if (isEditing.value && field.createOnly) {
      return draft;
    }

    const value = normalizeValue(field, form[field.key]);

    if (value !== undefined) {
      draft[field.key] = value;
    }

    return draft;
  }, {});

  if (config.value.key === 'plans') {
    body.projectType = 'micontrol';
  }

  return body;
}

async function loadRecord() {
  if (!isEditing.value) {
    return;
  }

  loadingRecord.value = true;
  error.value = '';

  try {
    const record = await apiRequest<Record<string, unknown>>(`${config.value.endpoint}/${recordId.value}`);
    config.value.fields.forEach((field) => setFieldValue(field, record));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el registro.';
  } finally {
    loadingRecord.value = false;
  }
}

async function loadPlans() {
  if (config.value.key !== 'tenants') {
    return;
  }

  loadingPlans.value = true;

  try {
    plans.value = await apiRequest<Plan[]>('/plans');
  } catch {
    plans.value = [];
  } finally {
    loadingPlans.value = false;
  }
}

async function loadCategoryOptions() {
  categoryOptions.value = [];

  if (config.value.key !== 'products') {
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

async function loadTenantAdmin() {
  if (config.value.key !== 'tenants' || !isEditing.value) {
    return;
  }

  loadingTenantAdmin.value = true;
  tenantAdminError.value = '';

  try {
    tenantAdmin.value = await apiRequest<User | null>(`${config.value.endpoint}/${recordId.value}/admin`);
  } catch (err) {
    tenantAdmin.value = null;
    tenantAdminError.value = err instanceof Error ? err.message : 'No se pudo cargar el administrador.';
  } finally {
    loadingTenantAdmin.value = false;
  }
}

async function updateTenantAdminPassword() {
  if (!tenantAdminPassword.value) {
    tenantAdminError.value = 'Informe una nueva contraseña.';
    return;
  }

  savingTenantAdminPassword.value = true;
  tenantAdminError.value = '';
  tenantAdminMessage.value = '';

  try {
    await apiRequest(`${config.value.endpoint}/${recordId.value}/admin/password`, {
      method: 'PATCH',
      body: {
        password: tenantAdminPassword.value,
      },
    });

    tenantAdminPassword.value = '';
    tenantAdminMessage.value = 'Contraseña del administrador actualizada.';
  } catch (err) {
    tenantAdminError.value = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
  } finally {
    savingTenantAdminPassword.value = false;
  }
}

async function save() {
  loading.value = true;
  error.value = '';

  try {
    let savedRecord: Record<string, unknown>;

    if (isEditing.value) {
      savedRecord = await apiRequest<Record<string, unknown>>(`${config.value.endpoint}/${recordId.value}`, {
        method: 'PATCH',
        body: payload(),
      });
    } else {
      savedRecord = await apiRequest<Record<string, unknown>>(config.value.endpoint, {
        method: 'POST',
        body: payload(),
      });
    }

    await uploadSelectedLogoFiles((savedRecord.id as string | number | undefined) || recordId.value);
    router.push(returnPath.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el registro.';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  resetForm();
  activeSettingsTab.value = 'identity';
  await loadCodePrefix();
  await loadCategoryOptions();
  await loadCustomerOptions();
  await loadServiceUserOptions();
  loadGeneratedCode();
  loadPlans();
  loadRecord();
  loadTenantAdmin();
});

onBeforeUnmount(() => {
  Object.keys(selectedLogoPreviewUrls).forEach((key) => revokeLogoPreviewUrl(key));
});
</script>

<template>
  <AdminLayout>
    <template #title>{{ title }}</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>{{ title }}</h2>
        <p>Complete los datos del registro y guarde los cambios.</p>
      </div>

      <form @submit.prevent="save">
        <div v-if="isSettingsForm && settingsFieldsByTab.length > 1" class="form-tabs" role="tablist" aria-label="Secciones de configuración">
          <button
            v-for="tab in settingsFieldsByTab"
            :key="tab.key"
            class="form-tab-button"
            :class="{ active: activeSettingsTab === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeSettingsTab === tab.key"
            @click="activeSettingsTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="form-row-grid">
          <template v-for="field in currentVisibleFields" :key="field.key">
            <div class="form-label">
              <label :for="field.key">{{ field.label }}</label>
            </div>
            <div class="form-field">
              <textarea
                v-if="field.type === 'textarea'"
                :id="field.key"
                :value="fieldText(field.key)"
                :disabled="loadingRecord"
                :placeholder="field.placeholder"
                :required="field.required"
                @input="updateText(field.key, $event)"
              />
              <span v-else-if="field.type === 'boolean'" class="switch-row">
                <input
                  :id="field.key"
                  type="checkbox"
                  :checked="fieldBoolean(field.key)"
                  :disabled="loadingRecord"
                  @change="updateBoolean(field.key, $event)"
                />
                <span>{{ fieldBoolean(field.key) ? 'Activo' : 'Inactivo' }}</span>
              </span>
              <div v-else-if="field.type === 'multiselect'" class="check-grid compact">
                <label v-for="option in field.options" :key="option.value" class="check-option">
                  <input
                    type="checkbox"
                    :value="option.value"
                    :checked="fieldArray(field.key).some((item) => String(item) === String(option.value))"
                    :disabled="loadingRecord"
                    @change="updateArray(field.key, option.value, $event)"
                  />
                  <span>
                    <strong>{{ option.label }}</strong>
                  </span>
                </label>
              </div>
              <div v-else-if="config.key === 'budgets' && field.key === 'customerId'" class="lookup-field">
                <input
                  :id="field.key"
                  :value="selectedCustomerLabel"
                  type="text"
                  :disabled="loadingRecord"
                  :required="field.required"
                  placeholder="Seleccione un cliente..."
                  readonly
                />
                <button
                  class="secondary-button lookup-button"
                  type="button"
                  :disabled="loadingRecord || loadingCustomers"
                  title="Buscar cliente"
                  aria-label="Buscar cliente"
                  @click="openCustomerModal"
                >
                  <Search :size="18" />
                </button>
              </div>
              <div v-else-if="hasFieldOptions(field)" class="stacked-field">
                <select
                  :id="field.key"
                  :value="fieldText(field.key)"
                  :disabled="loadingRecord || (field.key === 'planId' && loadingPlans) || (field.key === 'customerId' && loadingCustomers) || (field.key === 'userId' && loadingServiceUsers)"
                  :required="field.required"
                  @change="updateText(field.key, $event)"
                >
                  <option value="">
                    {{ field.key === 'planId' ? 'Tenant central (sin plan)' : field.key === 'customerId' && loadingCustomers ? 'Cargando clientes...' : field.key === 'userId' && loadingServiceUsers ? 'Cargando usuarios...' : 'Seleccione...' }}
                  </option>
                  <option v-for="option in fieldOptions(field)" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div v-else-if="isSettingsLogoField(field)" class="stacked-field logo-upload-field">
                <input
                  :id="field.key"
                  :value="fieldText(field.key)"
                  type="url"
                  :disabled="loadingRecord"
                  :placeholder="field.placeholder"
                  :required="field.required && !(isEditing && field.createOnly)"
                  @input="updateText(field.key, $event)"
                />
                <label class="file-picker-button" :for="`${field.key}-file`">
                  <Upload :size="18" />
                  <span>{{ selectedLogoFiles[field.key]?.name || 'Subir archivo' }}</span>
                </label>
                <input
                  :id="`${field.key}-file`"
                  class="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  :disabled="loadingRecord || loading"
                  @change="updateLogoFile(field.key, $event)"
                />
                <div v-if="logoPreviewSrc(field.key)" class="logo-preview-box">
                  <img :src="logoPreviewSrc(field.key)" :alt="field.label" />
                </div>
              </div>
              <input
                v-else
                :id="field.key"
                :value="fieldText(field.key)"
                :type="field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : field.type === 'password' ? 'password' : 'text'"
                :disabled="loadingRecord"
                :placeholder="field.placeholder"
                :required="field.required && !(isEditing && field.createOnly)"
                @input="updateText(field.key, $event)"
              />
            </div>
          </template>

          <div v-if="config.key === 'tenants' && isEditing" class="form-divider">
            <h3>Administrador</h3>
          </div>

          <template v-if="config.key === 'tenants' && isEditing">
            <div class="form-label">
              <span>Usuario administrador</span>
            </div>
            <div class="form-field">
              <div class="admin-user-box">
                <span v-if="loadingTenantAdmin" class="muted">Cargando administrador...</span>
                <template v-else-if="tenantAdmin">
                  <strong>{{ tenantAdmin.name }} {{ tenantAdmin.lastname || '' }}</strong>
                  <span>{{ tenantAdmin.username }} · {{ tenantAdmin.email }}</span>
                </template>
                <span v-else class="muted">No se encontró administrador para este tenant.</span>
              </div>
            </div>

            <div class="form-label">
              <label for="tenantAdminPassword">Nueva contraseña</label>
            </div>
            <div class="form-field">
              <div class="tenant-admin-password-row">
                <input
                  id="tenantAdminPassword"
                  v-model="tenantAdminPassword"
                  type="password"
                  autocomplete="new-password"
                  minlength="8"
                  :disabled="!tenantAdmin || savingTenantAdminPassword"
                  placeholder="mínimo 8 caracteres"
                />
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="!tenantAdmin || savingTenantAdminPassword"
                  @click="updateTenantAdminPassword"
                >
                  {{ savingTenantAdminPassword ? 'Actualizando...' : 'Cambiar contraseña' }}
                </button>
              </div>
              <p v-if="tenantAdminMessage" class="inline-feedback success">{{ tenantAdminMessage }}</p>
              <p v-if="tenantAdminError" class="inline-feedback error">{{ tenantAdminError }}</p>
            </div>
          </template>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <RouterLink class="secondary-button" :to="returnPath">
            <ArrowLeft :size="18" />
            Volver
          </RouterLink>
          <button class="primary-button" type="submit" :disabled="loading || loadingRecord">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Guardar registro' }}
          </button>
        </div>
      </form>
    </section>

    <div v-if="customerModalOpen" class="modal-backdrop" role="presentation" @click.self="closeCustomerModal">
      <section class="modal-panel customer-modal-panel" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <div class="modal-header">
          <div>
            <h2 id="customer-modal-title">Buscar cliente</h2>
            <p>Busque o seleccione un cliente para este presupuesto.</p>
          </div>
          <button class="icon-button" type="button" title="Cerrar" aria-label="Cerrar" @click="closeCustomerModal">
            <X :size="18" />
          </button>
        </div>

        <div class="customer-modal-body">
          <input
            v-model="customerSearch"
            type="search"
            :disabled="loadingCustomers"
            placeholder="Buscar por nombre, email o teléfono..."
            autofocus
          />

          <select
            :value="fieldText('customerId')"
            :disabled="loadingCustomers"
            :size="customerSelectSize"
            @change="selectCustomerFromEvent"
          >
            <option value="">
              {{ loadingCustomers ? 'Cargando clientes...' : 'Seleccione...' }}
            </option>
            <option v-for="option in filteredCustomerOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <p v-if="!loadingCustomers && !filteredCustomerOptions.length" class="muted">No se encontraron clientes.</p>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

