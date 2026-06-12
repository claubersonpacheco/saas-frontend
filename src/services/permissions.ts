import { authState } from '../stores/auth';

export function isMaster(): boolean {
  return authState.user?.role?.name.toLowerCase() === 'master';
}

export function hasPermission(permission?: string): boolean {
  if (!permission) {
    return true;
  }

  if (isMaster()) {
    return true;
  }

  return (
    authState.user?.role?.permissions?.some((item) => item.name === permission) ??
    false
  );
}

function normalizeModule(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function hasPlanModule(module?: string): boolean {
  if (!module) {
    return true;
  }

  if (isMaster()) {
    return true;
  }

  const modules = authState.user?.tenant?.plan?.modules ?? [];
  const normalizedModule = normalizeModule(module);

  return modules.some((item) => normalizeModule(item) === normalizedModule);
}

export function canAccessResource(resource: string): boolean {
  if (resource === 'permissions') {
    return isMaster();
  }

  return (
    hasPlanModule(resourcePlanModules[resource]) &&
    hasPermission(resourceReadPermissions[resource])
  );
}

export const resourceReadPermissions: Record<string, string> = {
  users: 'users.read',
  roles: 'roles.read',
  permissions: 'permissions.read',
  plans: 'plans.read',
  tenants: 'tenants.read',
  settings: 'settings.read',
  services: 'services.read',
  categories: 'categories.read',
  products: 'products.read',
  customers: 'customers.read',
  budgets: 'budgets.read',
  budgetItems: 'budget-items.read',
  freelancers: 'freelancers.read',
  suppliers: 'suppliers.read',
  budgetStatuses: 'budget-statuses.read',
  invoices: 'invoices.read',
  emails: 'emails.read',
  expenses: 'expenses.read',
  entries: 'entries.read',
  budgetTotals: 'budget-totals.read',
  budgetFilters: 'budget-filters.read',
};

export const resourcePlanModules: Record<string, string | undefined> = {
  users: 'users',
  roles: 'roles',
  permissions: undefined,
  plans: undefined,
  tenants: undefined,
  settings: 'settings',
  services: 'services',
  categories: 'budget',
  products: 'budget',
  customers: 'budget',
  budgets: 'budget',
  budgetItems: 'budget',
  freelancers: 'budget',
  suppliers: 'budget',
  budgetStatuses: 'budget',
  invoices: 'budget',
  emails: 'budget',
  expenses: 'budget',
  entries: 'budget',
  budgetTotals: 'budget',
  budgetFilters: 'budget',
};
