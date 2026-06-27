import type { Component } from 'vue';
import {
  Building2,
  Cog,
  CreditCard,
  KeyRound,
  ClipboardList,
  FileText,
  FolderTree,
  HandCoins,
  Mail,
  Package,
  ReceiptText,
  SlidersHorizontal,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
  WalletCards,
} from '@lucide/vue';

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'boolean'
  | 'csv'
  | 'multiselect'
  | 'date'
  | 'time';

export type ResourceField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  createOnly?: boolean;
  hideOnCreate?: boolean;
  hideOnEdit?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  options?: Array<{ value: string | number; label: string }>;
};

export type ResourceConfig = {
  key: string;
  title: string;
  endpoint: string;
  icon: Component;
  fields: ResourceField[];
  columns: string[];
  columnLabels?: Record<string, string>;
  createPath?: string;
  editPath?: (id: string | number) => string;
};

const ADDRESS_TYPE_OPTIONS = [
  { value: 1, label: 'Calle' },
  { value: 2, label: 'Avenida' },
  { value: 3, label: 'Paseo' },
];

const STATUS_OPTIONS = [
  { value: 3, label: 'Visitado' },
  { value: 2, label: 'Abierto' },
  { value: 1, label: 'En proceso' },
  { value: 0, label: 'Finalizado' },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'metro', label: 'Metro' },
  { value: 'centimetro', label: 'Centímetro' },
  { value: 'litros', label: 'Litros' },
  { value: 'dia', label: 'Día' },
  { value: 'hora', label: 'Hora' },
  { value: 'minuto', label: 'Minuto' },
];

const PLAN_MODULE_OPTIONS = [
  { value: 'users', label: 'Usuarios' },
  { value: 'roles', label: 'Roles' },
  { value: 'settings', label: 'Configuración' },
  { value: 'services', label: 'Servicios' },
  { value: 'budget', label: 'Budget' },
];

function addressTypeLabel(value: unknown): string {
  return ADDRESS_TYPE_OPTIONS.find((option) => option.value === Number(value))?.label || '';
}

function statusLabel(value: unknown): string {
  return STATUS_OPTIONS.find((option) => option.value === Number(value))?.label || '';
}

function formatTime(value: unknown): string {
  const time = String(value || '').trim();
  return time ? time.slice(0, 5) : '';
}

function formatDate(value: unknown): string {
  const date = String(value || '').trim();

  if (!date) {
    return '';
  }

  const [year, month, day] = date.slice(0, 10).split('-');

  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function getServiceMapAddress(item: Record<string, unknown>): string {
  const street = [addressTypeLabel(item.addressType), item.address]
    .filter((part) => part != null && String(part).trim() !== '')
    .map(String)
    .join(' ');

  const parts = [
    street,
    item.number,
    item.city,
    item.state,
    item.postal,
  ].filter((part) => part != null && String(part).trim() !== '');

  return parts.length ? parts.map(String).join(', ') : '-';
}

export const resources: Record<string, ResourceConfig> = {
  users: {
    key: 'users',
    title: 'Usuarios',
    endpoint: '/users',
    icon: UsersRound,
    columns: ['photoUrl', 'username', 'name', 'email', 'role'],
    createPath: '/users/create',
    editPath: (id) => `/users/${id}/edit`,
    columnLabels: {
      id: 'ID',
      photoUrl: 'Foto',
      username: 'Usuario',
      name: 'Nombre',
      email: 'Correo',
      role: 'Rol',
    },
    fields: [
      { key: 'username', label: 'Usuario', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'lastname', label: 'Apellido' },
      { key: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { key: 'roleId', label: 'ID del rol', type: 'number' },
      { key: 'password', label: 'Contraseña', type: 'password', createOnly: true, required: true, hideInTable: true },
    ],
  },
  roles: {
    key: 'roles',
    title: 'Roles',
    endpoint: '/roles',
    icon: ShieldCheck,
    columns: ['name', 'description'],
    createPath: '/roles/create',
    editPath: (id) => `/roles/${id}/edit`,
    columnLabels: {
      name: 'Nombre',
      description: 'Descripción',
    },
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'permissionIds', label: 'IDs de permisos', type: 'csv', placeholder: '1,2,3' },
    ],
  },
  permissions: {
    key: 'permissions',
    title: 'Permisos',
    endpoint: '/permissions',
    icon: KeyRound,
    columns: ['id', 'name', 'description'],
    createPath: '/permissions/create',
    editPath: (id) => `/permissions/${id}/edit`,
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      description: 'Descripción',
    },
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  plans: {
    key: 'plans',
    title: 'Planes',
    endpoint: '/plans',
    icon: CreditCard,
    columns: ['id', 'name', 'price', 'billingPeriod', 'modules', 'active'],
    createPath: '/plans/create',
    editPath: (id) => `/plans/${id}/edit`,
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      description: 'Descripción',
      price: 'Precio',
      billingPeriod: 'Facturación',
      modules: 'Módulos',
      active: 'Activo',
    },
    fields: [
      { key: 'code', label: 'Código' },
      { key: 'publicId', label: 'ID público' },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'price', label: 'Precio', type: 'number', defaultValue: 0 },
      { key: 'currency', label: 'Moneda', defaultValue: 'EUR' },
      {
        key: 'billingPeriod',
        label: 'Período',
        options: [
          { value: 'monthly', label: 'Mensual' },
          { value: 'yearly', label: 'Anual' },
          { value: 'lifetime', label: 'Vitalicio' },
        ],
        defaultValue: 'monthly',
      },
      { key: 'trialDays', label: 'Días de prueba', type: 'number', defaultValue: 0 },
      { key: 'maxUsers', label: 'Máximo usuarios', type: 'number' },
      { key: 'maxProjects', label: 'Máximo proyectos', type: 'number' },
      { key: 'maxStorageMb', label: 'Almacenamiento MB', type: 'number' },
      { key: 'features', label: 'Features', type: 'csv', placeholder: 'feature-a,feature-b' },
      {
        key: 'modules',
        label: 'Módulos disponibles',
        type: 'multiselect',
        options: PLAN_MODULE_OPTIONS,
        defaultValue: [],
      },
      { key: 'highlighted', label: 'Destacado', type: 'boolean' },
      { key: 'active', label: 'Activo', type: 'boolean' },
      { key: 'isPublic', label: 'Público', type: 'boolean' },
      { key: 'sortOrder', label: 'Orden', type: 'number', defaultValue: 0 },
      { key: 'taxPercentage', label: 'Impuesto %', type: 'number', defaultValue: 0 },
    ],
  },
  categories: {
    key: 'categories',
    title: 'Categorías',
    endpoint: '/categories',
    icon: Tags,
    columns: ['id', 'name', 'description'],
    createPath: '/categories/create',
    editPath: (id) => `/categories/${id}/edit`,
    columnLabels: { id: 'ID', name: 'Nombre', description: 'Descripción' },
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  products: {
    key: 'products',
    title: 'Productos',
    endpoint: '/products',
    icon: Package,
    columns: ['code', 'name', 'productType', 'price', 'category'],
    createPath: '/products/create',
    editPath: (id) => `/products/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', productType: 'Tipo', price: 'Precio', category: 'Categoría' },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'productType', label: 'Tipo', required: true, options: PRODUCT_TYPE_OPTIONS },
      { key: 'price', label: 'Precio', type: 'number', required: true, defaultValue: 0 },
      { key: 'categoryId', label: 'Categoría', type: 'number' },
    ],
  },
  customers: {
    key: 'customers',
    title: 'Clientes',
    endpoint: '/customers',
    icon: UsersRound,
    columns: ['code', 'name', 'email', 'phone', 'document'],
    createPath: '/customers/create',
    editPath: (id) => `/customers/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', email: 'Correo', phone: 'Teléfono', document: 'Documento' },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'email', label: 'Correo', type: 'email', required: true },
      { key: 'phone', label: 'Teléfono', required: true },
      { key: 'document', label: 'Documento' },
      { key: 'address', label: 'Dirección', required: true },
    ],
  },
  budgets: {
    key: 'budgets',
    title: 'Presupuestos',
    endpoint: '/budgets',
    icon: WalletCards,
    columns: ['code', 'name', 'customer', 'user', 'date', 'expirate'],
    createPath: '/budgets/create',
    editPath: (id) => `/budgets/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', customer: 'Cliente', user: 'Responsable', date: 'Fecha', expirate: 'Vence' },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'customerId', label: 'Cliente', type: 'number', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'expirate', label: 'Vencimiento', type: 'date' },
      { key: 'totalExpirate', label: 'Días vencimiento', type: 'number', defaultValue: 30 },
      { key: 'showService', label: 'Mostrar servicio', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showDescription', label: 'Mostrar descripción', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showQtd', label: 'Mostrar cantidad', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showPrice', label: 'Mostrar precio', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showTax', label: 'Mostrar impuesto', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showTotal', label: 'Mostrar total', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showTaxValue', label: 'Mostrar valor impuesto', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
      { key: 'showSubTotal', label: 'Mostrar subtotal', type: 'boolean', defaultValue: false, hideOnCreate: true, hideOnEdit: true },
    ],
  },
  budgetItems: {
    key: 'budgetItems',
    title: 'Items presupuesto',
    endpoint: '/budget-items',
    icon: ClipboardList,
    columns: ['budget', 'product', 'quantity', 'price', 'total'],
    createPath: '/budget-items/create',
    editPath: (id) => `/budget-items/${id}/edit`,
    columnLabels: { budget: 'Presupuesto', product: 'Producto', quantity: 'Cantidad', price: 'Precio', total: 'Total' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'productId', label: 'ID producto', type: 'number', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'quantity', label: 'Cantidad', type: 'number', required: true, defaultValue: 1 },
      { key: 'tax', label: 'Impuesto %', type: 'number', defaultValue: 0 },
      { key: 'price', label: 'Precio', type: 'number', defaultValue: 0 },
      { key: 'taxValue', label: 'Valor impuesto', type: 'number', defaultValue: 0 },
      { key: 'subtotal', label: 'Subtotal', type: 'number', defaultValue: 0 },
      { key: 'total', label: 'Total', type: 'number', defaultValue: 0 },
      { key: 'position', label: 'Posición', type: 'number', defaultValue: 0 },
    ],
  },
  freelancers: {
    key: 'freelancers',
    title: 'Freelancers',
    endpoint: '/freelancers',
    icon: HandCoins,
    columns: ['code', 'name', 'email', 'phone', 'status'],
    createPath: '/freelancers/create',
    editPath: (id) => `/freelancers/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', email: 'Correo', phone: 'Teléfono', status: 'Estado' },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'birthDate', label: 'Nacimiento', type: 'date' },
      { key: 'email', label: 'Correo', type: 'email' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'role', label: 'Función' },
      { key: 'status', label: 'Estado', type: 'number', defaultValue: 1 },
      { key: 'address', label: 'Dirección' },
      { key: 'city', label: 'Ciudad' },
      { key: 'state', label: 'Estado' },
      { key: 'zip', label: 'Código postal' },
      { key: 'document', label: 'Documento' },
      { key: 'accountBank', label: 'Banco' },
      { key: 'accountNumber', label: 'Cuenta' },
    ],
  },
  suppliers: {
    key: 'suppliers',
    title: 'Proveedores',
    endpoint: '/suppliers',
    icon: Truck,
    columns: ['code', 'name', 'email', 'phone', 'serviceType'],
    createPath: '/suppliers/create',
    editPath: (id) => `/suppliers/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', email: 'Correo', phone: 'Teléfono', serviceType: 'Servicio' },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'email', label: 'Correo', type: 'email' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'serviceType', label: 'Tipo servicio' },
      { key: 'address', label: 'Dirección' },
      { key: 'city', label: 'Ciudad' },
      { key: 'state', label: 'Estado' },
      { key: 'zip', label: 'Código postal' },
      { key: 'document', label: 'Documento' },
      { key: 'accountBank', label: 'Banco' },
      { key: 'accountNumber', label: 'Cuenta' },
      { key: 'client', label: 'Cliente', type: 'boolean' },
      { key: 'codeClient', label: 'Código cliente' },
    ],
  },
  budgetStatuses: {
    key: 'budgetStatuses',
    title: 'Estados presupuesto',
    endpoint: '/budget-statuses',
    icon: FileText,
    columns: ['budget', 'status', 'comments', 'changedByUser'],
    createPath: '/budget-statuses/create',
    editPath: (id) => `/budget-statuses/${id}/edit`,
    columnLabels: { budget: 'Presupuesto', status: 'Estado', comments: 'Comentarios', changedByUser: 'Cambiado por' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'status', label: 'Estado', type: 'number', defaultValue: 1 },
      { key: 'comments', label: 'Comentarios', type: 'textarea' },
      { key: 'changedBy', label: 'ID usuario', type: 'number' },
    ],
  },
  invoices: {
    key: 'invoices',
    title: 'Facturas',
    endpoint: '/invoices',
    icon: ReceiptText,
    columns: ['serie', 'numero', 'customer', 'fechaEmision', 'importeTotal'],
    createPath: '/invoices/create',
    editPath: (id) => `/invoices/${id}/edit`,
    columnLabels: { serie: 'Serie', numero: 'Número', customer: 'Cliente', fechaEmision: 'Emisión', importeTotal: 'Total' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'customerId', label: 'ID cliente', type: 'number', required: true },
      { key: 'serie', label: 'Serie', required: true },
      { key: 'numero', label: 'Número', required: true },
      { key: 'fechaEmision', label: 'Fecha emisión', type: 'date', required: true },
      { key: 'baseImponible', label: 'Base imponible', type: 'number', required: true },
      { key: 'tipoIva', label: 'IVA %', type: 'number', required: true },
      { key: 'cuotaIva', label: 'Cuota IVA', type: 'number', required: true },
      { key: 'importeTotal', label: 'Total', type: 'number', required: true },
      { key: 'estadoAeat', label: 'Estado AEAT', defaultValue: 'pendente' },
      { key: 'pdfUrl', label: 'PDF URL' },
      { key: 'xmlUrl', label: 'XML URL' },
    ],
  },
  emails: {
    key: 'emails',
    title: 'Emails',
    endpoint: '/emails',
    icon: Mail,
    columns: ['subject', 'recipientEmail', 'customer', 'status'],
    createPath: '/emails/create',
    editPath: (id) => `/emails/${id}/edit`,
    columnLabels: { subject: 'Asunto', recipientEmail: 'Destinatario', customer: 'Cliente', status: 'Estado' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'customerId', label: 'ID cliente', type: 'number', required: true },
      { key: 'subject', label: 'Asunto', required: true },
      { key: 'recipientEmail', label: 'Destinatario', type: 'email', required: true },
      { key: 'additionalEmails', label: 'Emails adicionales' },
      { key: 'message', label: 'Mensaje', type: 'textarea' },
      { key: 'status', label: 'Enviado', type: 'boolean' },
      { key: 'errorMessage', label: 'Error' },
      { key: 'file', label: 'Archivo' },
    ],
  },
  expenses: {
    key: 'expenses',
    title: 'Gastos',
    endpoint: '/expenses',
    icon: HandCoins,
    columns: ['code', 'name', 'budget', 'supplier', 'amount'],
    createPath: '/expenses/create',
    editPath: (id) => `/expenses/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', budget: 'Presupuesto', supplier: 'Proveedor', amount: 'Importe' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'supplierId', label: 'ID proveedor', type: 'number' },
      { key: 'categoryId', label: 'ID categoría', type: 'number' },
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'amount', label: 'Importe', type: 'number', required: true },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'method', label: 'Método' },
      { key: 'invoice', label: 'Factura', type: 'boolean' },
      { key: 'invoiceNumber', label: 'Número factura' },
      { key: 'filename', label: 'Archivo' },
      { key: 'filePath', label: 'Ruta archivo' },
    ],
  },
  entries: {
    key: 'entries',
    title: 'Entradas',
    endpoint: '/entries',
    icon: FolderTree,
    columns: ['code', 'name', 'budget', 'amount', 'method'],
    createPath: '/entries/create',
    editPath: (id) => `/entries/${id}/edit`,
    columnLabels: { code: 'Código', name: 'Nombre', budget: 'Presupuesto', amount: 'Importe', method: 'Método' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'categoryId', label: 'ID categoría', type: 'number' },
      { key: 'code', label: 'Código', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'amount', label: 'Importe', type: 'number', required: true },
      { key: 'method', label: 'Método' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'receivedBy', label: 'Recibido por' },
      { key: 'receipt', label: 'Recibo', type: 'boolean' },
      { key: 'receiptNumber', label: 'Número recibo' },
      { key: 'filename', label: 'Archivo' },
      { key: 'filePath', label: 'Ruta archivo' },
    ],
  },
  budgetTotals: {
    key: 'budgetTotals',
    title: 'Totales presupuesto',
    endpoint: '/budget-totals',
    icon: ReceiptText,
    columns: ['budget', 'grossTotal', 'expensesTotal', 'entriesTotal', 'finalBalance'],
    createPath: '/budget-totals/create',
    editPath: (id) => `/budget-totals/${id}/edit`,
    columnLabels: { budget: 'Presupuesto', grossTotal: 'Total bruto', expensesTotal: 'Gastos', entriesTotal: 'Entradas', finalBalance: 'Saldo final' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'itemsSubtotal', label: 'Subtotal items', type: 'number', defaultValue: 0 },
      { key: 'itemsTaxTotal', label: 'IVA items', type: 'number', defaultValue: 0 },
      { key: 'expensesTotal', label: 'Total gastos', type: 'number', defaultValue: 0 },
      { key: 'entriesTotal', label: 'Total entradas', type: 'number', defaultValue: 0 },
      { key: 'grossTotal', label: 'Total bruto', type: 'number', defaultValue: 0 },
      { key: 'netTotal', label: 'Total neto', type: 'number', defaultValue: 0 },
      { key: 'budgetValue', label: 'Valor presupuesto', type: 'number', defaultValue: 0 },
      { key: 'differenceTotal', label: 'Diferencia', type: 'number', defaultValue: 0 },
      { key: 'finalBalance', label: 'Saldo final', type: 'number', defaultValue: 0 },
      { key: 'ivaToPay', label: 'IVA a pagar', type: 'number', defaultValue: 0 },
      { key: 'profitMargin', label: 'Margen %', type: 'number', defaultValue: 0 },
    ],
  },
  budgetFilters: {
    key: 'budgetFilters',
    title: 'Filtros presupuesto',
    endpoint: '/budget-filters',
    icon: SlidersHorizontal,
    columns: ['budget', 'showBiService', 'showExCode', 'showEnCode'],
    createPath: '/budget-filters/create',
    editPath: (id) => `/budget-filters/${id}/edit`,
    columnLabels: { budget: 'Presupuesto', showBiService: 'Items servicio', showExCode: 'Gastos código', showEnCode: 'Entradas código' },
    fields: [
      { key: 'budgetId', label: 'ID presupuesto', type: 'number', required: true },
      { key: 'showBiService', label: 'Mostrar item servicio', type: 'boolean' },
      { key: 'showBiDescription', label: 'Mostrar item descripción', type: 'boolean' },
      { key: 'showBiQtd', label: 'Mostrar item cantidad', type: 'boolean' },
      { key: 'showBiPrice', label: 'Mostrar item precio', type: 'boolean' },
      { key: 'showBiTax', label: 'Mostrar item impuesto', type: 'boolean' },
      { key: 'showBiTotal', label: 'Mostrar item total', type: 'boolean' },
      { key: 'showBiTaxValue', label: 'Mostrar item valor impuesto', type: 'boolean' },
      { key: 'showBiSubTotal', label: 'Mostrar item subtotal', type: 'boolean' },
      { key: 'showExCode', label: 'Mostrar gasto código', type: 'boolean' },
      { key: 'showExName', label: 'Mostrar gasto nombre', type: 'boolean' },
      { key: 'showExDescription', label: 'Mostrar gasto descripción', type: 'boolean' },
      { key: 'showExAmount', label: 'Mostrar gasto importe', type: 'boolean' },
      { key: 'showExDate', label: 'Mostrar gasto fecha', type: 'boolean' },
      { key: 'showExMethod', label: 'Mostrar gasto método', type: 'boolean' },
      { key: 'showExInvoiceNumber', label: 'Mostrar gasto factura', type: 'boolean' },
      { key: 'showEnCode', label: 'Mostrar entrada código', type: 'boolean' },
      { key: 'showEnName', label: 'Mostrar entrada nombre', type: 'boolean' },
      { key: 'showEnAmount', label: 'Mostrar entrada importe', type: 'boolean' },
      { key: 'showEnMethod', label: 'Mostrar entrada método', type: 'boolean' },
    ],
  },
  tenants: {
    key: 'tenants',
    title: 'Empresas',
    endpoint: '/tenants',
    icon: Building2,
    columns: ['id', 'name', 'slug', 'plan', 'active'],
    createPath: '/tenants/create',
    editPath: (id) => `/tenants/${id}/edit`,
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      slug: 'Slug',
      plan: 'Plan',
      active: 'Activo',
    },
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'slug', label: 'Slug' },
      { key: 'planId', label: 'Plan', type: 'number', options: [] },
      { key: 'active', label: 'Activo', type: 'boolean' },
    ],
  },
  settings: {
    key: 'settings',
    title: 'Configuración',
    endpoint: '/settings',
    icon: Cog,
    columns: ['id', 'name', 'prefix', 'logo'],
    createPath: '/settings/create',
    editPath: (id) => `/settings/${id}/edit`,
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      prefix: 'Prefijo',
      logo: 'Logo',
    },
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'prefix', label: 'Prefijo' },
      { key: 'logo', label: 'Logo URL' },
      { key: 'logoIcon', label: 'URL del icono del logo' },
      { key: 'logoPrint', label: 'URL del logo para impresión' },
      { key: 'logoWhite', label: 'URL del logo blanco' },
    ],
  },
  services: {
    key: 'services',
    title: 'Servicios',
    endpoint: '/services',
    icon: ClipboardList,
    columns: ['code', 'hourRange', 'fullAddress', 'user', 'status', 'dateStart'],
    createPath: '/services/create',
    editPath: (id) => `/services/${id}/edit`,
    columnLabels: {
      code: 'Código',
      hourRange: 'Hora',
      fullAddress: 'Dirección completa',
      user: 'Responsable',
      status: 'Estado',
      dateStart: 'Fecha',
    },
    fields: [
      { key: 'code', label: 'Código', required: true },
      { key: 'userId', label: 'Responsable', type: 'number', required: true },
      {
        key: 'addressType',
        label: 'Tipo de dirección',
        type: 'number',
        required: true,
        defaultValue: 1,
        options: ADDRESS_TYPE_OPTIONS,
      },
      { key: 'address', label: 'Dirección' },
      { key: 'number', label: 'Número' },
      { key: 'complement', label: 'Complemento' },
      { key: 'city', label: 'Ciudad' },
      { key: 'state', label: 'Estado' },
      { key: 'postal', label: 'Código postal' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      {
        key: 'status',
        label: 'Estado del servicio',
        type: 'number',
        required: true,
        defaultValue: 2,
        options: STATUS_OPTIONS,
      },
      { key: 'dateStart', label: 'Fecha inicio', type: 'date' },
      { key: 'dateEnd', label: 'Fecha fin', type: 'date' },
      { key: 'hourStart', label: 'Hora inicio', type: 'time' },
      { key: 'hourEnd', label: 'Hora fin', type: 'time' },
    ],
  },
};

export function getValue(item: Record<string, unknown>, key: string): string {
  const value = item[key];

  if (key === 'fullAddress') {
    const street = [addressTypeLabel(item.addressType), item.address]
      .filter((part) => part != null && String(part).trim() !== '')
      .map(String)
      .join(' ');

    const parts = [
      street,
      item.number,
      item.complement,
      item.city,
      item.state,
      item.postal,
    ].filter((part) => part != null && String(part).trim() !== '');

    return parts.length ? parts.map(String).join(', ') : '-';
  }

  if (key === 'hourRange') {
    const start = formatTime(item.hourStart);
    const end = formatTime(item.hourEnd);

    return start && end ? `${start} - ${end}` : '-';
  }

  if (key === 'status') {
    return statusLabel(value) || '-';
  }

  if (key === 'dateStart') {
    return formatDate(value) || '-';
  }

  if (['date', 'expirate', 'birthDate', 'fechaEmision'].includes(key)) {
    return formatDate(value) || '-';
  }

  if (key === 'role') {
    return String((value as { name?: string } | null)?.name || '-');
  }

  if (key === 'plan') {
    return String((value as { name?: string } | null)?.name || 'Tenant central');
  }

  if (key === 'permissions') {
    const permissions = value as Array<{ name: string }> | undefined;
    return permissions?.map((permission) => permission.name).join(', ') || '-';
  }

  if (key === 'user') {
    const user = value as { name?: string; username?: string; email?: string } | null;
    return String(user?.name || user?.username || user?.email || '-');
  }

  if (['category', 'customer', 'budget', 'product', 'supplier', 'changedByUser'].includes(key)) {
    const relation = value as { name?: string; code?: string; username?: string; email?: string } | null;
    return String(relation?.name || relation?.code || relation?.username || relation?.email || '-');
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  return value == null || value === '' ? '-' : String(value);
}
