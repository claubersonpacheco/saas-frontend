<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Edit3, Grip, Plus, Trash2, X } from '@lucide/vue';
import AppShell from '../../components/AppShell.vue';
import { apiRequest } from '../../services/api';

type Product = {
  id: number;
  code?: string;
  name?: string;
  description?: string | null;
  price?: string | number;
};

type BudgetItem = {
  id: number;
  budgetId: number;
  productId: number;
  product?: Product;
  description?: string | null;
  quantity?: number | string;
  tax?: number | string;
  price?: number | string;
  taxValue?: number | string;
  subtotal?: number | string;
  total?: number | string;
  position?: number | string;
  sortOrder?: number | string;
};

type Budget = {
  id: number;
  showService?: boolean;
  showDescription?: boolean;
  showQtd?: boolean;
  showPrice?: boolean;
  showTax?: boolean;
  showTotal?: boolean;
  showTaxValue?: boolean;
  showSubTotal?: boolean;
};

type BudgetColumnKey =
  | 'showService'
  | 'showDescription'
  | 'showQtd'
  | 'showPrice'
  | 'showTax'
  | 'showSubTotal'
  | 'showTaxValue'
  | 'showTotal';

const COLUMN_OPTIONS: Array<{ key: BudgetColumnKey; label: string }> = [
  { key: 'showService', label: 'Servicio' },
  { key: 'showDescription', label: 'Descripción' },
  { key: 'showQtd', label: 'Quantity' },
  { key: 'showPrice', label: 'Price unit' },
  { key: 'showTax', label: 'Tax' },
  { key: 'showSubTotal', label: 'Subtotal' },
  { key: 'showTaxValue', label: 'Tax value' },
  { key: 'showTotal', label: 'Total' },
];

const route = useRoute();
const budgetId = computed(() => String(route.params.id || ''));
const budget = ref<Budget | null>(null);
const selectedColumnKeys = ref<BudgetColumnKey[]>([]);
const products = ref<Product[]>([]);
const items = ref<BudgetItem[]>([]);
const modalOpen = ref(false);
const loadingItems = ref(false);
const loadingProducts = ref(false);
const savingItem = ref(false);
const deletingItemId = ref<number | null>(null);
const editingItem = ref<BudgetItem | null>(null);
const draggedItemId = ref<number | null>(null);
const dragOverItemId = ref<number | null>(null);
const suppressProductAutofill = ref(false);
const error = ref('');
const form = reactive({
  productId: '',
  description: '',
  quantity: 1,
  tax: 0,
  price: 0,
  taxValue: 0,
  subtotal: 0,
  total: 0,
  position: 0,
});

const selectedProduct = computed(() =>
  products.value.find((product) => String(product.id) === form.productId),
);
const itemTotals = computed(() =>
  items.value.reduce(
    (totals, item) => ({
      subtotal: totals.subtotal + Number(item.subtotal || 0),
      taxValue: totals.taxValue + Number(item.taxValue || 0),
      total: totals.total + Number(item.total || 0),
    }),
    { subtotal: 0, taxValue: 0, total: 0 },
  ),
);
const orderedItems = computed(() =>
  [...items.value].sort((a, b) => {
    const positionA = Number(a.position ?? a.sortOrder ?? a.id);
    const positionB = Number(b.position ?? b.sortOrder ?? b.id);

    return positionA - positionB;
  }),
);
const positionOptions = computed(() =>
  Array.from({ length: editingItem.value ? items.value.length : items.value.length + 1 }, (_, index) => index + 1),
);
const visibleDataColumnCount = computed(() =>
  COLUMN_OPTIONS.filter((column) => isColumnVisible(column.key)).length,
);
const tableColspan = computed(() => visibleDataColumnCount.value + 3);
const modalTitle = computed(() => (editingItem.value ? 'Editar item' : 'Agregar producto'));

function productLabel(product: Product) {
  return [product.code, product.name].filter(Boolean).join(' - ') || `Producto #${product.id}`;
}

function itemProductName(item: BudgetItem) {
  return item.product?.name || productLabel({ id: item.productId });
}

function money(value: unknown) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function isColumnVisible(key: BudgetColumnKey) {
  return selectedColumnKeys.value.includes(key);
}

function syncSelectedColumns() {
  selectedColumnKeys.value = COLUMN_OPTIONS
    .filter((column) => budget.value?.[column.key])
    .map((column) => column.key);
}

async function saveColumnVisibility() {
  const selected = new Set(selectedColumnKeys.value);
  const payload = COLUMN_OPTIONS.reduce<Record<BudgetColumnKey, boolean>>((draft, column) => {
    draft[column.key] = selected.has(column.key);
    return draft;
  }, {} as Record<BudgetColumnKey, boolean>);

  budget.value = {
    ...(budget.value || { id: Number(budgetId.value) }),
    ...payload,
  };

  try {
    budget.value = await apiRequest<Budget>(`/budgets/${budgetId.value}`, {
      method: 'PATCH',
      body: payload,
    });
    syncSelectedColumns();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar el filtro.';
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function recalculateTotals() {
  const quantity = Number(form.quantity || 0);
  const price = Number(form.price || 0);
  const tax = Number(form.tax || 0);
  const subtotal = roundMoney(quantity * price);
  const taxValue = roundMoney(subtotal * (tax / 100));

  form.subtotal = subtotal;
  form.taxValue = taxValue;
  form.total = roundMoney(subtotal + taxValue);
}

function resetItemForm() {
  editingItem.value = null;
  form.productId = '';
  form.description = '';
  form.quantity = 1;
  form.tax = 0;
  form.price = 0;
  form.taxValue = 0;
  form.subtotal = 0;
  form.total = 0;
  form.position = items.value.length + 1;
}

function openProductModal() {
  error.value = '';
  resetItemForm();
  modalOpen.value = true;
}

function openEditModal(item: BudgetItem) {
  error.value = '';
  editingItem.value = item;
  suppressProductAutofill.value = true;
  form.productId = String(item.productId);
  form.description = item.description || '';
  form.quantity = Number(item.quantity || 1);
  form.tax = Number(item.tax || 0);
  form.price = Number(item.price || 0);
  form.taxValue = Number(item.taxValue || 0);
  form.subtotal = Number(item.subtotal || 0);
  form.total = Number(item.total || 0);
  form.position = Number(item.position || item.sortOrder || orderedItems.value.findIndex((current) => current.id === item.id) + 1);
  recalculateTotals();
  modalOpen.value = true;
}

function closeProductModal() {
  if (savingItem.value) {
    return;
  }

  modalOpen.value = false;
  error.value = '';
}

async function loadProducts() {
  loadingProducts.value = true;

  try {
    products.value = await apiRequest<Product[]>('/products');
  } catch (err) {
    products.value = [];
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar los productos.';
  } finally {
    loadingProducts.value = false;
  }
}

async function loadBudget() {
  try {
    budget.value = await apiRequest<Budget>(`/budgets/${budgetId.value}`);
    syncSelectedColumns();
  } catch (err) {
    budget.value = null;
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el presupuesto.';
  }
}

async function loadItems() {
  loadingItems.value = true;

  try {
    const data = await apiRequest<BudgetItem[]>('/budget-items');
    items.value = data.filter((item) => String(item.budgetId) === budgetId.value);
  } catch (err) {
    items.value = [];
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar los items.';
  } finally {
    loadingItems.value = false;
  }
}

async function shiftItemPositions(position: number) {
  const itemsToMove = orderedItems.value
    .map((item, index) => ({
      item,
      currentPosition: Number(item.position || item.sortOrder || index + 1),
    }))
    .filter(({ currentPosition }) => currentPosition >= position)
    .sort((a, b) => b.currentPosition - a.currentPosition);

  await Promise.all(
    itemsToMove.map(({ item, currentPosition }) =>
      apiRequest(`/budget-items/${item.id}`, {
        method: 'PATCH',
        body: {
          position: currentPosition + 1,
        },
      }),
    ),
  );
}

async function shiftItemPositionsForEdit(oldPosition: number, newPosition: number, itemId: number) {
  if (oldPosition === newPosition) {
    return;
  }

  const positionedItems = orderedItems.value.map((item, index) => ({
    item,
    currentPosition: Number(item.position || item.sortOrder || index + 1),
  }));

  const itemsToMove = positionedItems
    .filter(({ item, currentPosition }) => {
      if (item.id === itemId) {
        return false;
      }

      return newPosition < oldPosition
        ? currentPosition >= newPosition && currentPosition < oldPosition
        : currentPosition > oldPosition && currentPosition <= newPosition;
    })
    .sort((a, b) => (newPosition < oldPosition ? b.currentPosition - a.currentPosition : a.currentPosition - b.currentPosition));

  await Promise.all(
    itemsToMove.map(({ item, currentPosition }) =>
      apiRequest(`/budget-items/${item.id}`, {
        method: 'PATCH',
        body: {
          position: newPosition < oldPosition ? currentPosition + 1 : currentPosition - 1,
        },
      }),
    ),
  );
}

async function saveProductItem() {
  const product = selectedProduct.value;

  if (!product) {
    error.value = 'Seleccione un producto.';
    return;
  }

  recalculateTotals();

  savingItem.value = true;
  error.value = '';

  try {
    const position = Number(form.position || items.value.length + 1);

    if (editingItem.value) {
      const oldPosition = Number(
        editingItem.value.position ||
          editingItem.value.sortOrder ||
          orderedItems.value.findIndex((item) => item.id === editingItem.value?.id) + 1,
      );

      await shiftItemPositionsForEdit(oldPosition, position, editingItem.value.id);
      await apiRequest(`/budget-items/${editingItem.value.id}`, {
        method: 'PATCH',
        body: {
          productId: product.id,
          description: form.description,
          quantity: Number(form.quantity || 0),
          tax: Number(form.tax || 0),
          price: Number(form.price || 0),
          taxValue: form.taxValue,
          subtotal: form.subtotal,
          total: form.total,
          position,
        },
      });
    } else {
      await shiftItemPositions(position);

      await apiRequest('/budget-items', {
        method: 'POST',
        body: {
          budgetId: Number(budgetId.value),
          productId: product.id,
          description: form.description,
          quantity: Number(form.quantity || 0),
          tax: Number(form.tax || 0),
          price: Number(form.price || 0),
          taxValue: form.taxValue,
          subtotal: form.subtotal,
          total: form.total,
          position,
        },
      });
    }

    modalOpen.value = false;
    resetItemForm();
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo agregar el producto.';
  } finally {
    savingItem.value = false;
  }
}

async function removeItem(item: BudgetItem) {
  if (!window.confirm(`¿Eliminar item #${item.id}?`)) {
    return;
  }

  deletingItemId.value = item.id;
  error.value = '';

  try {
    await apiRequest(`/budget-items/${item.id}`, { method: 'DELETE' });
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo eliminar el item.';
  } finally {
    deletingItemId.value = null;
  }
}

function dragStart(item: BudgetItem, event: DragEvent) {
  draggedItemId.value = item.id;
  event.dataTransfer?.setData('text/plain', String(item.id));
  event.dataTransfer?.setDragImage((event.currentTarget as HTMLElement), 18, 18);
}

function dragOver(item: BudgetItem) {
  if (draggedItemId.value && draggedItemId.value !== item.id) {
    dragOverItemId.value = item.id;
  }
}

function dragEnd() {
  draggedItemId.value = null;
  dragOverItemId.value = null;
}

async function dropItem(targetItem: BudgetItem) {
  const draggedId = draggedItemId.value;

  if (!draggedId || draggedId === targetItem.id) {
    dragEnd();
    return;
  }

  const currentItems = [...orderedItems.value];
  const fromIndex = currentItems.findIndex((item) => item.id === draggedId);
  const toIndex = currentItems.findIndex((item) => item.id === targetItem.id);

  if (fromIndex < 0 || toIndex < 0) {
    dragEnd();
    return;
  }

  const [movedItem] = currentItems.splice(fromIndex, 1);
  currentItems.splice(toIndex, 0, movedItem);
  items.value = currentItems.map((item, index) => ({ ...item, position: index + 1 }));
  dragEnd();

  try {
    await Promise.all(
      items.value.map((item, index) =>
        apiRequest(`/budget-items/${item.id}`, {
          method: 'PATCH',
          body: {
            position: index + 1,
          },
        }),
      ),
    );
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar el orden.';
    await loadItems();
  }
}

watch(selectedProduct, (product) => {
  if (suppressProductAutofill.value) {
    suppressProductAutofill.value = false;
    return;
  }

  if (!product) {
    form.description = '';
    form.price = 0;
    recalculateTotals();
    return;
  }

  form.description = product.description || '';
  form.price = Number(product.price || 0);
  recalculateTotals();
});

watch(
  () => [form.quantity, form.price, form.tax],
  recalculateTotals,
);

onMounted(async () => {
  await Promise.all([loadBudget(), loadProducts(), loadItems()]);
});
</script>

<template>
  <AppShell>
    <template #title>Items presupuesto #{{ budgetId }}</template>

    <section class="budget-items-card">
      <div class="budget-items-header">
        <h2>Servicios</h2>
        <div class="budget-items-actions">
          <button class="secondary-button compact" type="button">
            Ver
          </button>
          <label class="budget-column-filter">
            <span>Filter</span>
            <select v-model="selectedColumnKeys" multiple size="1" @change="saveColumnVisibility">
              <option v-for="column in COLUMN_OPTIONS" :key="column.key" :value="column.key">
                {{ column.label }}
              </option>
            </select>
            <span class="count-badge">{{ visibleDataColumnCount }}</span>
          </label>
          <button class="primary-button compact" type="button" @click="openProductModal">
            <Plus :size="18" />
            Añadir
          </button>
        </div>
      </div>

      <p v-if="error" class="alert error budget-items-alert">{{ error }}</p>

      <div class="budget-items-scroll">
        <table class="budget-items-table">
          <thead>
            <tr>
              <th class="check-cell"><input type="checkbox" disabled /></th>
              <th>ORD</th>
              <th v-if="isColumnVisible('showService')">Servicio</th>
              <th v-if="isColumnVisible('showDescription')">Descripción</th>
              <th v-if="isColumnVisible('showQtd')">Quantity</th>
              <th v-if="isColumnVisible('showPrice')">Price unit</th>
              <th v-if="isColumnVisible('showTax')">Tax</th>
              <th v-if="isColumnVisible('showSubTotal')">Subtotal</th>
              <th v-if="isColumnVisible('showTaxValue')">Tax value</th>
              <th v-if="isColumnVisible('showTotal')">Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingItems">
              <td :colspan="tableColspan" class="budget-items-empty">Cargando...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td :colspan="tableColspan" class="budget-items-empty">No se encontraron items.</td>
            </tr>
            <tr
              v-for="item in orderedItems"
              v-else
              :key="item.id"
              :class="{ 'is-dragging': draggedItemId === item.id, 'is-drag-over': dragOverItemId === item.id }"
              draggable="true"
              @dragstart="dragStart(item, $event)"
              @dragover.prevent="dragOver(item)"
              @dragleave="dragOverItemId = null"
              @dragend="dragEnd"
              @drop.prevent="dropItem(item)"
            >
              <td class="check-cell"><input type="checkbox" /></td>
              <td class="drag-cell" aria-label="Orden"><Grip :size="16" /></td>
              <td v-if="isColumnVisible('showService')" class="service-cell">{{ itemProductName(item) }}</td>
              <td v-if="isColumnVisible('showDescription')" class="description-cell">{{ item.description || '-' }}</td>
              <td v-if="isColumnVisible('showQtd')">{{ item.quantity || 0 }}</td>
              <td v-if="isColumnVisible('showPrice')">{{ money(item.price) }}</td>
              <td v-if="isColumnVisible('showTax')">{{ Number(item.tax || 0) }}%</td>
              <td v-if="isColumnVisible('showSubTotal')">{{ money(item.subtotal) }}</td>
              <td v-if="isColumnVisible('showTaxValue')">{{ money(item.taxValue) }}</td>
              <td v-if="isColumnVisible('showTotal')">{{ money(item.total) }}</td>
              <td>
                <div class="budget-item-actions">
                  <button class="resource-table-icon" type="button" title="Editar" aria-label="Editar" @click="openEditModal(item)">
                    <Edit3 :size="16" />
                  </button>
                  <button
                    class="resource-table-icon danger"
                    type="button"
                    title="Eliminar"
                    aria-label="Eliminar"
                    :disabled="deletingItemId === item.id"
                    @click="removeItem(item)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="budget-items-bottom">
      <div class="budget-observation">
        <strong>Observación</strong>
      </div>
      <div class="budget-total-box">
        <div v-if="isColumnVisible('showSubTotal')"><span>Subtotal:</span><strong>{{ money(itemTotals.subtotal) }}</strong></div>
        <div v-if="isColumnVisible('showTaxValue')"><span>Tax:</span><strong>{{ money(itemTotals.taxValue) }}</strong></div>
        <div v-if="isColumnVisible('showTotal')"><span>Total:</span><strong>{{ money(itemTotals.total) }}</strong></div>
      </div>
    </section>

    <div v-if="modalOpen" class="modal-backdrop" role="presentation" @click.self="closeProductModal">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
        <div class="modal-header">
          <div>
            <h2 id="add-product-title">{{ modalTitle }}</h2>
            <p>Seleccione un producto cadastrado para incluir en este presupuesto.</p>
          </div>
          <button class="icon-button" type="button" title="Cerrar" aria-label="Cerrar" @click="closeProductModal">
            <X :size="18" />
          </button>
        </div>

        <form class="modal-form budget-item-modal-form" @submit.prevent="saveProductItem">
          <label class="service-filter-field">
            <span>Producto</span>
            <select v-model="form.productId" :disabled="loadingProducts || savingItem" required>
              <option value="">
                {{ loadingProducts ? 'Cargando productos...' : 'Seleccione...' }}
              </option>
              <option v-for="product in products" :key="product.id" :value="String(product.id)">
                {{ productLabel(product) }}
              </option>
            </select>
          </label>

          <label class="service-filter-field full">
            <span>Descripción</span>
            <textarea v-model="form.description" :disabled="savingItem" rows="3" />
          </label>

          <label class="service-filter-field">
            <span>Cantidad</span>
            <input v-model.number="form.quantity" type="number" min="0" step="1" :disabled="savingItem" required />
          </label>

          <label class="service-filter-field">
            <span>Precio unitario</span>
            <input v-model.number="form.price" type="number" min="0" step="0.01" :disabled="savingItem" required />
          </label>

          <label class="service-filter-field">
            <span>Impuesto %</span>
            <input v-model.number="form.tax" type="number" min="0" step="0.01" :disabled="savingItem" />
          </label>

          <label class="service-filter-field">
            <span>Valor impuesto</span>
            <input :value="form.taxValue.toFixed(2)" type="number" readonly />
          </label>

          <label class="service-filter-field">
            <span>Subtotal</span>
            <input :value="form.subtotal.toFixed(2)" type="number" readonly />
          </label>

          <label class="service-filter-field">
            <span>Total</span>
            <input :value="form.total.toFixed(2)" type="number" readonly />
          </label>

          <label class="service-filter-field">
            <span>ORD</span>
            <select v-model.number="form.position" :disabled="savingItem">
              <option v-for="position in positionOptions" :key="position" :value="position">
                {{ position }}
              </option>
            </select>
          </label>

          <p v-if="error" class="alert error">{{ error }}</p>

          <div class="form-actions">
            <button class="secondary-button" type="button" :disabled="savingItem" @click="closeProductModal">
              Cancelar
            </button>
            <button class="primary-button" type="submit" :disabled="savingItem || loadingProducts">
              {{ savingItem ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </AppShell>
</template>
