import { createRouter, createWebHistory } from 'vue-router';
import { hasPermission, hasPlanModule, isMaster } from '@/services/permissions';
import { apiRequest } from '@/services/api';
import { authState, updateUser } from '@/stores/auth';
import type { User } from '@/types';
import LoginPage from '@/views/auth/pages/auth/login.vue';
import DashboardPage from '@/views/admin/pages/dashboard/index.vue';
import BunnyGlobalSettingsPage from '@/views/admin/pages/global-settings/bunny.vue';
import BudgetFiltersCreatePage from '@/views/admin/pages/budget-filters/create.vue';
import BudgetFiltersEditPage from '@/views/admin/pages/budget-filters/edit.vue';
import BudgetFiltersIndexPage from '@/views/admin/pages/budget-filters/index.vue';
import BudgetItemsCreatePage from '@/views/admin/pages/budget-items/create.vue';
import BudgetItemsEditPage from '@/views/admin/pages/budget-items/edit.vue';
import BudgetItemsIndexPage from '@/views/admin/pages/budget-items/index.vue';
import BudgetStatusesCreatePage from '@/views/admin/pages/budget-statuses/create.vue';
import BudgetStatusesEditPage from '@/views/admin/pages/budget-statuses/edit.vue';
import BudgetStatusesIndexPage from '@/views/admin/pages/budget-statuses/index.vue';
import BudgetTotalsCreatePage from '@/views/admin/pages/budget-totals/create.vue';
import BudgetTotalsEditPage from '@/views/admin/pages/budget-totals/edit.vue';
import BudgetTotalsIndexPage from '@/views/admin/pages/budget-totals/index.vue';
import BudgetsCreatePage from '@/views/admin/pages/budgets/create.vue';
import BudgetsEditPage from '@/views/admin/pages/budgets/edit.vue';
import BudgetsIndexPage from '@/views/admin/pages/budgets/index.vue';
import BudgetsItemsPage from '@/views/admin/pages/budgets/items.vue';
import CategoriesCreatePage from '@/views/admin/pages/categories/create.vue';
import CategoriesEditPage from '@/views/admin/pages/categories/edit.vue';
import CategoriesIndexPage from '@/views/admin/pages/categories/index.vue';
import CustomersCreatePage from '@/views/admin/pages/customers/create.vue';
import CustomersEditPage from '@/views/admin/pages/customers/edit.vue';
import CustomersIndexPage from '@/views/admin/pages/customers/index.vue';
import EmailsCreatePage from '@/views/admin/pages/emails/create.vue';
import EmailsEditPage from '@/views/admin/pages/emails/edit.vue';
import EmailsIndexPage from '@/views/admin/pages/emails/index.vue';
import EntriesCreatePage from '@/views/admin/pages/entries/create.vue';
import EntriesEditPage from '@/views/admin/pages/entries/edit.vue';
import EntriesIndexPage from '@/views/admin/pages/entries/index.vue';
import ExpensesCreatePage from '@/views/admin/pages/expenses/create.vue';
import ExpensesEditPage from '@/views/admin/pages/expenses/edit.vue';
import ExpensesIndexPage from '@/views/admin/pages/expenses/index.vue';
import FreelancersCreatePage from '@/views/admin/pages/freelancers/create.vue';
import FreelancersEditPage from '@/views/admin/pages/freelancers/edit.vue';
import FreelancersIndexPage from '@/views/admin/pages/freelancers/index.vue';
import InvoicesCreatePage from '@/views/admin/pages/invoices/create.vue';
import InvoicesEditPage from '@/views/admin/pages/invoices/edit.vue';
import InvoicesIndexPage from '@/views/admin/pages/invoices/index.vue';
import PermissionsCreatePage from '@/views/admin/pages/permissions/create.vue';
import PermissionsEditPage from '@/views/admin/pages/permissions/edit.vue';
import PermissionsIndexPage from '@/views/admin/pages/permissions/index.vue';
import PlansCreatePage from '@/views/admin/pages/plans/create.vue';
import PlansEditPage from '@/views/admin/pages/plans/edit.vue';
import PlansIndexPage from '@/views/admin/pages/plans/index.vue';
import ProfilePage from '@/views/admin/pages/profile/index.vue';
import PasswordPage from '@/views/admin/pages/profile/password.vue';
import RolesCreatePage from '@/views/admin/pages/roles/create.vue';
import RolesEditPage from '@/views/admin/pages/roles/edit.vue';
import RolesIndexPage from '@/views/admin/pages/roles/index.vue';
import SettingsCreatePage from '@/views/admin/pages/settings/create.vue';
import SettingsEditPage from '@/views/admin/pages/settings/edit.vue';
import SettingsIndexPage from '@/views/admin/pages/settings/index.vue';
import ServicesCreatePage from '@/views/admin/pages/services/create.vue';
import ServicesEditPage from '@/views/admin/pages/services/edit.vue';
import ServicesIndexPage from '@/views/admin/pages/services/index.vue';
import ProductsCreatePage from '@/views/admin/pages/products/create.vue';
import ProductsEditPage from '@/views/admin/pages/products/edit.vue';
import ProductsIndexPage from '@/views/admin/pages/products/index.vue';
import SuppliersCreatePage from '@/views/admin/pages/suppliers/create.vue';
import SuppliersEditPage from '@/views/admin/pages/suppliers/edit.vue';
import SuppliersIndexPage from '@/views/admin/pages/suppliers/index.vue';
import TenantsCreatePage from '@/views/admin/pages/tenants/create.vue';
import TenantsEditPage from '@/views/admin/pages/tenants/edit.vue';
import TenantsIndexPage from '@/views/admin/pages/tenants/index.vue';
import UsersCreatePage from '@/views/admin/pages/users/create.vue';
import UsersEditPage from '@/views/admin/pages/users/edit.vue';
import UsersIndexPage from '@/views/admin/pages/users/index.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true, title: 'Entrar' } },
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { title: 'Panel' } },
    { path: '/perfil', name: 'profile', component: ProfilePage, meta: { title: 'Perfil' } },
    { path: '/perfil/password', name: 'password', component: PasswordPage, meta: { title: 'Contraseña' } },
    { path: '/global-settings/bunny', name: 'global-settings-bunny', component: BunnyGlobalSettingsPage, meta: { masterOnly: true, title: 'Bunny' } },
    { path: '/users', name: 'users-index', component: UsersIndexPage, meta: { permission: 'users.read', module: 'users' } },
    { path: '/users/create', name: 'user-create', component: UsersCreatePage, meta: { permission: 'users.create', module: 'users' } },
    { path: '/users/:id/edit', name: 'user-edit', component: UsersEditPage, meta: { permission: 'users.update', module: 'users' } },
    { path: '/roles', name: 'roles-index', component: RolesIndexPage, meta: { permission: 'roles.read', module: 'roles' } },
    { path: '/roles/create', name: 'role-create', component: RolesCreatePage, meta: { permission: 'roles.create', module: 'roles' } },
    { path: '/roles/:id/edit', name: 'role-edit', component: RolesEditPage, meta: { permission: 'roles.update', module: 'roles' } },
    { path: '/permissions', name: 'permissions-index', component: PermissionsIndexPage, meta: { permission: 'permissions.read' } },
    { path: '/permissions/create', name: 'permission-create', component: PermissionsCreatePage, meta: { permission: 'permissions.create' } },
    { path: '/permissions/:id/edit', name: 'permission-edit', component: PermissionsEditPage, meta: { permission: 'permissions.update' } },
    { path: '/plans', name: 'plans-index', component: PlansIndexPage, meta: { permission: 'plans.read' } },
    { path: '/plans/create', name: 'plan-create', component: PlansCreatePage, meta: { permission: 'plans.create' } },
    { path: '/plans/:id/edit', name: 'plan-edit', component: PlansEditPage, meta: { permission: 'plans.update' } },
    { path: '/tenants', name: 'tenants-index', component: TenantsIndexPage, meta: { permission: 'tenants.read' } },
    { path: '/tenants/create', name: 'tenant-create', component: TenantsCreatePage, meta: { permission: 'tenants.create' } },
    { path: '/tenants/:id/edit', name: 'tenant-edit', component: TenantsEditPage, meta: { permission: 'tenants.update' } },
    { path: '/settings', name: 'settings-index', component: SettingsIndexPage, meta: { permission: 'settings.read', module: 'settings' } },
    { path: '/settings/create', name: 'setting-create', component: SettingsCreatePage, meta: { permission: 'settings.create', module: 'settings' } },
    { path: '/settings/:id/edit', name: 'setting-edit', component: SettingsEditPage, meta: { permission: 'settings.update', module: 'settings' } },
    { path: '/services', name: 'services-index', component: ServicesIndexPage, meta: { permission: 'services.read', module: 'services' } },
    { path: '/services/create', name: 'service-create', component: ServicesCreatePage, meta: { permission: 'services.create', module: 'services' } },
    { path: '/services/:id/edit', name: 'service-edit', component: ServicesEditPage, meta: { permission: 'services.update', module: 'services' } },
    { path: '/categories', name: 'categories-index', component: CategoriesIndexPage, meta: { permission: 'categories.read', module: 'budget' } },
    { path: '/categories/create', name: 'category-create', component: CategoriesCreatePage, meta: { permission: 'categories.create', module: 'budget' } },
    { path: '/categories/:id/edit', name: 'category-edit', component: CategoriesEditPage, meta: { permission: 'categories.update', module: 'budget' } },
    { path: '/products', name: 'products-index', component: ProductsIndexPage, meta: { permission: 'products.read', module: 'budget' } },
    { path: '/products/create', name: 'product-create', component: ProductsCreatePage, meta: { permission: 'products.create', module: 'budget' } },
    { path: '/products/:id/edit', name: 'product-edit', component: ProductsEditPage, meta: { permission: 'products.update', module: 'budget' } },
    { path: '/customers', name: 'customers-index', component: CustomersIndexPage, meta: { permission: 'customers.read', module: 'budget' } },
    { path: '/customers/create', name: 'customer-create', component: CustomersCreatePage, meta: { permission: 'customers.create', module: 'budget' } },
    { path: '/customers/:id/edit', name: 'customer-edit', component: CustomersEditPage, meta: { permission: 'customers.update', module: 'budget' } },
    { path: '/budgets', name: 'budgets-index', component: BudgetsIndexPage, meta: { permission: 'budgets.read', module: 'budget' } },
    { path: '/budgets/create', name: 'budget-create', component: BudgetsCreatePage, meta: { permission: 'budgets.create', module: 'budget' } },
    { path: '/budgets/:id/edit', name: 'budget-edit', component: BudgetsEditPage, meta: { permission: 'budgets.update', module: 'budget' } },
    { path: '/budgets/:id/items', name: 'budget-items-by-budget', component: BudgetsItemsPage, meta: { permission: 'budget-items.read', module: 'budget' } },
    { path: '/budget-items', name: 'budget-items-index', component: BudgetItemsIndexPage, meta: { permission: 'budget-items.read', module: 'budget' } },
    { path: '/budget-items/create', name: 'budget-item-create', component: BudgetItemsCreatePage, meta: { permission: 'budget-items.create', module: 'budget' } },
    { path: '/budget-items/:id/edit', name: 'budget-item-edit', component: BudgetItemsEditPage, meta: { permission: 'budget-items.update', module: 'budget' } },
    { path: '/freelancers', name: 'freelancers-index', component: FreelancersIndexPage, meta: { permission: 'freelancers.read', module: 'budget' } },
    { path: '/freelancers/create', name: 'freelancer-create', component: FreelancersCreatePage, meta: { permission: 'freelancers.create', module: 'budget' } },
    { path: '/freelancers/:id/edit', name: 'freelancer-edit', component: FreelancersEditPage, meta: { permission: 'freelancers.update', module: 'budget' } },
    { path: '/suppliers', name: 'suppliers-index', component: SuppliersIndexPage, meta: { permission: 'suppliers.read', module: 'budget' } },
    { path: '/suppliers/create', name: 'supplier-create', component: SuppliersCreatePage, meta: { permission: 'suppliers.create', module: 'budget' } },
    { path: '/suppliers/:id/edit', name: 'supplier-edit', component: SuppliersEditPage, meta: { permission: 'suppliers.update', module: 'budget' } },
    { path: '/budget-statuses', name: 'budget-statuses-index', component: BudgetStatusesIndexPage, meta: { permission: 'budget-statuses.read', module: 'budget' } },
    { path: '/budget-statuses/create', name: 'budget-status-create', component: BudgetStatusesCreatePage, meta: { permission: 'budget-statuses.create', module: 'budget' } },
    { path: '/budget-statuses/:id/edit', name: 'budget-status-edit', component: BudgetStatusesEditPage, meta: { permission: 'budget-statuses.update', module: 'budget' } },
    { path: '/invoices', name: 'invoices-index', component: InvoicesIndexPage, meta: { permission: 'invoices.read', module: 'budget' } },
    { path: '/invoices/create', name: 'invoice-create', component: InvoicesCreatePage, meta: { permission: 'invoices.create', module: 'budget' } },
    { path: '/invoices/:id/edit', name: 'invoice-edit', component: InvoicesEditPage, meta: { permission: 'invoices.update', module: 'budget' } },
    { path: '/emails', name: 'emails-index', component: EmailsIndexPage, meta: { permission: 'emails.read', module: 'budget' } },
    { path: '/emails/create', name: 'email-create', component: EmailsCreatePage, meta: { permission: 'emails.create', module: 'budget' } },
    { path: '/emails/:id/edit', name: 'email-edit', component: EmailsEditPage, meta: { permission: 'emails.update', module: 'budget' } },
    { path: '/expenses', name: 'expenses-index', component: ExpensesIndexPage, meta: { permission: 'expenses.read', module: 'budget' } },
    { path: '/expenses/create', name: 'expense-create', component: ExpensesCreatePage, meta: { permission: 'expenses.create', module: 'budget' } },
    { path: '/expenses/:id/edit', name: 'expense-edit', component: ExpensesEditPage, meta: { permission: 'expenses.update', module: 'budget' } },
    { path: '/entries', name: 'entries-index', component: EntriesIndexPage, meta: { permission: 'entries.read', module: 'budget' } },
    { path: '/entries/create', name: 'entry-create', component: EntriesCreatePage, meta: { permission: 'entries.create', module: 'budget' } },
    { path: '/entries/:id/edit', name: 'entry-edit', component: EntriesEditPage, meta: { permission: 'entries.update', module: 'budget' } },
    { path: '/budget-totals', name: 'budget-totals-index', component: BudgetTotalsIndexPage, meta: { permission: 'budget-totals.read', module: 'budget' } },
    { path: '/budget-totals/create', name: 'budget-total-create', component: BudgetTotalsCreatePage, meta: { permission: 'budget-totals.create', module: 'budget' } },
    { path: '/budget-totals/:id/edit', name: 'budget-total-edit', component: BudgetTotalsEditPage, meta: { permission: 'budget-totals.update', module: 'budget' } },
    { path: '/budget-filters', name: 'budget-filters-index', component: BudgetFiltersIndexPage, meta: { permission: 'budget-filters.read', module: 'budget' } },
    { path: '/budget-filters/create', name: 'budget-filter-create', component: BudgetFiltersCreatePage, meta: { permission: 'budget-filters.create', module: 'budget' } },
    { path: '/budget-filters/:id/edit', name: 'budget-filter-edit', component: BudgetFiltersEditPage, meta: { permission: 'budget-filters.update', module: 'budget' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

let currentUserLoaded = false;

async function refreshCurrentUser() {
  if (currentUserLoaded || !authState.accessToken) {
    return;
  }

  currentUserLoaded = true;
  const user = await apiRequest<User>('/auth/me');
  updateUser(user);
}

router.beforeEach(async (to) => {
  if (!to.meta.public && !authState.accessToken) {
    return { name: 'login' };
  }

  if (to.name === 'login' && authState.accessToken) {
    return { name: 'dashboard' };
  }

  if (!to.meta.public) {
    try {
      await refreshCurrentUser();
    } catch {
      return { name: 'login' };
    }
  }

  const permission = to.meta.permission as string | undefined;
  const module = to.meta.module as string | undefined;
  const masterOnly = Boolean(to.meta.masterOnly);

  if (
    (masterOnly && !isMaster()) ||
    (module && !hasPlanModule(module)) ||
    (permission && !hasPermission(permission))
  ) {
    return { name: 'dashboard' };
  }

  return true;
});
