<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import {
  Building2,
  Cog,
  Database,
  CreditCard,
  FolderTree,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  Mail,
  Package,
  ReceiptText,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
  WalletCards,
  ClipboardList,
} from '@lucide/vue';
import { canAccessResource, hasPermission, isMaster } from '@/services/permissions';
import { authState } from '@/stores/auth';
import { brandingState } from '@/stores/branding';

type MenuItem = {
  to: string;
  label: string;
  icon: Component;
  permission?: string;
  resource?: string;
  masterOnly?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: 'Principal',
    items: [
      { to: '/', label: 'Panel', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/users', label: 'Usuarios', icon: UsersRound, permission: 'users.read', resource: 'users' },
      { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles.read', resource: 'roles' },
      { to: '/permissions', label: 'Permisos', icon: KeyRound, permission: 'permissions.read', resource: 'permissions' },
      { to: '/plans', label: 'Planes', icon: CreditCard, permission: 'plans.read', resource: 'plans' },
      { to: '/tenants', label: 'Empresas', icon: Building2, permission: 'tenants.read', resource: 'tenants' },
      { to: '/settings', label: 'Configuración', icon: Cog, permission: 'settings.read', resource: 'settings' },
      { to: '/global-settings/bunny', label: 'Bunny global', icon: Database, masterOnly: true },
    ],
  },
  {
    title: 'Operación',
    items: [
      { to: '/services', label: 'Servicios', icon: ClipboardList, permission: 'services.read', resource: 'services' },
    ],
  },
  {
    title: 'Presupuestos',
    items: [
      { to: '/budgets', label: 'Presupuestos', icon: WalletCards, permission: 'budgets.read', resource: 'budgets' },
      { to: '/customers', label: 'Clientes', icon: UsersRound, permission: 'customers.read', resource: 'customers' },
      { to: '/categories', label: 'Categorías', icon: Tags, permission: 'categories.read', resource: 'categories' },
      { to: '/products', label: 'Productos', icon: Package, permission: 'products.read', resource: 'products' },
      { to: '/freelancers', label: 'Freelancers', icon: HandCoins, permission: 'freelancers.read', resource: 'freelancers' },
      { to: '/suppliers', label: 'Proveedores', icon: Truck, permission: 'suppliers.read', resource: 'suppliers' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { to: '/invoices', label: 'Facturas', icon: ReceiptText, permission: 'invoices.read', resource: 'invoices' },
      { to: '/expenses', label: 'Gastos', icon: HandCoins, permission: 'expenses.read', resource: 'expenses' },
      { to: '/entries', label: 'Entradas', icon: FolderTree, permission: 'entries.read', resource: 'entries' },
      { to: '/emails', label: 'Emails', icon: Mail, permission: 'emails.read', resource: 'emails' },
    ],
  },
];

const visibleMenuGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.masterOnly
          ? isMaster()
          : item.resource
            ? canAccessResource(item.resource)
            : hasPermission(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0),
);
</script>

<template>
  <div class="relative flex flex-col h-full max-h-full">
    <div class="px-6 pt-4 flex items-center">
      <RouterLink class="flex-none rounded-xl text-xl inline-flex items-center gap-x-2 font-semibold focus:outline-hidden focus:opacity-80" to="/" aria-label="MiControl">
        <span class="app-brand-mark size-9 rounded-xl">
          <img v-if="brandingState.logo" :src="brandingState.logo" :alt="brandingState.name" />
          <span v-else>M</span>
        </span>
        <span class="text-gray-900 dark:text-neutral-100">{{ brandingState.name }}</span>
      </RouterLink>
    </div>

    <div class="px-6 py-3">
      <p class="text-xs text-gray-500 dark:text-neutral-400 truncate">
        {{ authState.user?.tenant?.name || 'Admin' }}
      </p>
      <p class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">
        {{ authState.user?.name || authState.user?.username }}
      </p>
      <p class="text-xs text-primary-700 dark:text-primary-300 truncate">
        {{ authState.user?.role?.name || 'sin rol' }}
      </p>
    </div>

    <div class="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <nav class="hs-accordion-group p-3 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
        <div class="flex flex-col gap-5">
          <section v-for="group in visibleMenuGroups" :key="group.title">
            <h2 class="mb-2 px-2.5 text-[11px] font-bold uppercase text-gray-400 dark:text-neutral-500">
              {{ group.title }}
            </h2>

            <ul class="flex flex-col space-y-1">
              <li v-for="item in group.items" :key="item.to">
                <RouterLink
                  :to="item.to"
                  class="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-gray-800 dark:text-neutral-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700"
                  active-class="bg-gray-100 dark:bg-neutral-700"
                >
                  <component :is="item.icon" class="shrink-0 size-4" />
                  {{ item.label }}
                </RouterLink>
              </li>
            </ul>
          </section>
        </div>
      </nav>
    </div>
  </div>
</template>
