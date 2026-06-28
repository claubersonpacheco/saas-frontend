<script setup lang="ts">
import { ArrowLeft, Save } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '@/views/admin/layout/AdminLayout.vue';
import { apiRequest } from '@/services/api';

type EmailRecord = {
  id: number;
  budgetId?: number | null;
  customerId?: number | null;
  subject?: string | null;
  recipientEmail?: string | null;
  additionalEmails?: string | null;
  message?: string | null;
  status?: boolean | null;
  errorMessage?: string | null;
  file?: string | null;
};

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingRecord = ref(false);
const error = ref('');

const emailId = computed(() => String(route.params.id || ''));
const isEditing = computed(() => Boolean(emailId.value));
const title = computed(() => (isEditing.value ? 'Editar email' : 'Nuevo email'));

const form = reactive({
  budgetId: '',
  customerId: '',
  subject: '',
  recipientEmail: '',
  additionalEmails: '',
  message: '',
  status: false,
  errorMessage: '',
  file: '',
});

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function additionalEmailList() {
  return form.additionalEmails
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validate() {
  if (!form.budgetId || Number.isNaN(Number(form.budgetId))) {
    return 'Informe un presupuesto válido.';
  }

  if (!form.customerId || Number.isNaN(Number(form.customerId))) {
    return 'Informe un cliente válido.';
  }

  if (!form.subject.trim()) {
    return 'Informe el asunto del email.';
  }

  if (!isValidEmail(form.recipientEmail)) {
    return 'Informe un destinatario válido.';
  }

  if (additionalEmailList().some((email) => !isValidEmail(email))) {
    return 'Revise los emails adicionales.';
  }

  return '';
}

function payload() {
  return {
    budgetId: Number(form.budgetId),
    customerId: Number(form.customerId),
    subject: form.subject.trim(),
    recipientEmail: form.recipientEmail.trim(),
    additionalEmails: form.additionalEmails.trim() || undefined,
    message: form.message.trim() || undefined,
    status: form.status,
    errorMessage: form.errorMessage.trim() || undefined,
    file: form.file.trim() || undefined,
  };
}

async function loadEmail() {
  if (!isEditing.value) {
    return;
  }

  loadingRecord.value = true;
  error.value = '';

  try {
    const email = await apiRequest<EmailRecord>(`/emails/${emailId.value}`);
    form.budgetId = email.budgetId == null ? '' : String(email.budgetId);
    form.customerId = email.customerId == null ? '' : String(email.customerId);
    form.subject = email.subject || '';
    form.recipientEmail = email.recipientEmail || '';
    form.additionalEmails = email.additionalEmails || '';
    form.message = email.message || '';
    form.status = Boolean(email.status);
    form.errorMessage = email.errorMessage || '';
    form.file = email.file || '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el email.';
  } finally {
    loadingRecord.value = false;
  }
}

async function save() {
  const validationError = validate();

  if (validationError) {
    error.value = validationError;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    if (isEditing.value) {
      await apiRequest<EmailRecord>(`/emails/${emailId.value}`, {
        method: 'PATCH',
        body: payload(),
      });
    } else {
      await apiRequest<EmailRecord>('/emails', {
        method: 'POST',
        body: payload(),
      });
    }

    router.push('/emails');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el email.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadEmail);
</script>

<template>
  <AdminLayout>
    <template #title>{{ title }}</template>

    <section class="form-card">
      <div class="form-card-header">
        <h2>{{ title }}</h2>
        <p>Administre destinatarios, mensaje y estado de envío.</p>
      </div>

      <form @submit.prevent="save">
        <div class="form-row-grid">
          <div class="form-label">
            <label for="budgetId">ID presupuesto</label>
          </div>
          <div class="form-field">
            <input id="budgetId" v-model="form.budgetId" type="number" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="customerId">ID cliente</label>
          </div>
          <div class="form-field">
            <input id="customerId" v-model="form.customerId" type="number" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="subject">Asunto</label>
          </div>
          <div class="form-field">
            <input id="subject" v-model="form.subject" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="recipientEmail">Destinatario</label>
          </div>
          <div class="form-field">
            <input id="recipientEmail" v-model="form.recipientEmail" type="email" :disabled="loadingRecord" required />
          </div>

          <div class="form-label">
            <label for="additionalEmails">Emails adicionales</label>
          </div>
          <div class="form-field">
            <input
              id="additionalEmails"
              v-model="form.additionalEmails"
              :disabled="loadingRecord"
              placeholder="email1@dominio.com, email2@dominio.com"
            />
          </div>

          <div class="form-label">
            <label for="message">Mensaje</label>
          </div>
          <div class="form-field">
            <textarea id="message" v-model="form.message" :disabled="loadingRecord" />
          </div>

          <div class="form-label">
            <label for="status">Enviado</label>
          </div>
          <div class="form-field">
            <span class="switch-row">
              <input id="status" v-model="form.status" type="checkbox" :disabled="loadingRecord" />
              <span>{{ form.status ? 'Sí' : 'No' }}</span>
            </span>
          </div>

          <div class="form-label">
            <label for="errorMessage">Error</label>
          </div>
          <div class="form-field">
            <textarea id="errorMessage" v-model="form.errorMessage" :disabled="loadingRecord" />
          </div>

          <div class="form-label">
            <label for="file">Archivo</label>
          </div>
          <div class="form-field">
            <input id="file" v-model="form.file" :disabled="loadingRecord" />
          </div>
        </div>

        <p v-if="error" class="alert error">{{ error }}</p>

        <div class="form-actions">
          <RouterLink class="secondary-button" to="/emails">
            <ArrowLeft :size="18" />
            Volver
          </RouterLink>
          <button class="primary-button" type="submit" :disabled="loading || loadingRecord">
            <Save :size="18" />
            {{ loading ? 'Guardando...' : 'Guardar email' }}
          </button>
        </div>
      </form>
    </section>
  </AdminLayout>
</template>
