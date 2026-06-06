import type { Component } from 'vue';
import {
  Building2,
  Cog,
  CreditCard,
  KeyRound,
  ShieldCheck,
  UsersRound,
} from '@lucide/vue';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'boolean' | 'csv';

export type ResourceField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  createOnly?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
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

export const resources: Record<string, ResourceConfig> = {
  users: {
    key: 'users',
    title: 'Usuarios',
    endpoint: '/users',
    icon: UsersRound,
    columns: ['id', 'username', 'name', 'email', 'role'],
    createPath: '/users/create',
    editPath: (id) => `/users/${id}/edit`,
    columnLabels: {
      id: 'ID',
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
    columns: ['id', 'name', 'description', 'permissions'],
    createPath: '/roles/create',
    editPath: (id) => `/roles/${id}/edit`,
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      description: 'Descripción',
      permissions: 'Permisos',
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
    columns: ['id', 'name', 'slug', 'projectType', 'active'],
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      slug: 'Slug',
      projectType: 'Tipo de proyecto',
      active: 'Activo',
    },
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'slug', label: 'Slug' },
      { key: 'projectType', label: 'Tipo de proyecto', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'modules', label: 'Módulos', type: 'csv', placeholder: 'crm,finanzas,inventario' },
      { key: 'active', label: 'Activo', type: 'boolean' },
    ],
  },
  tenants: {
    key: 'tenants',
    title: 'Empresas',
    endpoint: '/tenants',
    icon: Building2,
    columns: ['id', 'name', 'slug', 'plan', 'active'],
    createPath: '/tenants/create',
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
      { key: 'planId', label: 'ID del plan', type: 'number' },
      { key: 'active', label: 'Activo', type: 'boolean' },
    ],
  },
  settings: {
    key: 'settings',
    title: 'Configuración',
    endpoint: '/settings',
    icon: Cog,
    columns: ['id', 'name', 'logo', 'bunnyStorageCdnDomain'],
    columnLabels: {
      id: 'ID',
      name: 'Nombre',
      logo: 'Logo',
      bunnyStorageCdnDomain: 'Dominio CDN Bunny',
    },
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'logo', label: 'Logo URL' },
      { key: 'logoIcon', label: 'URL del icono del logo' },
      { key: 'logoPrint', label: 'URL del logo para impresión' },
      { key: 'logoWhite', label: 'URL del logo blanco' },
      { key: 'bunnyStorageZoneName', label: 'Zona Bunny' },
      { key: 'bunnyStorageAccessKey', label: 'Clave de acceso Bunny' },
      { key: 'bunnyStorageCdnDomain', label: 'Dominio CDN Bunny' },
      { key: 'bunnyStorageBaseUrl', label: 'URL base Bunny' },
      { key: 'bunnyStorageUserFolder', label: 'Carpeta de usuarios' },
      { key: 'bunnyStorageLogoFolder', label: 'Carpeta de logos' },
    ],
  },
};

export function getValue(item: Record<string, unknown>, key: string): string {
  const value = item[key];

  if (key === 'role') {
    return String((value as { name?: string } | null)?.name || '-');
  }

  if (key === 'plan') {
    return String((value as { name?: string } | null)?.name || '-');
  }

  if (key === 'permissions') {
    const permissions = value as Array<{ name: string }> | undefined;
    return permissions?.map((permission) => permission.name).join(', ') || '-';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  return value == null || value === '' ? '-' : String(value);
}
