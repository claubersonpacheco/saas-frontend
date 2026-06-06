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

export function canAccessResource(resource: string): boolean {
  if (resource === 'permissions') {
    return isMaster();
  }

  return hasPermission(resourceReadPermissions[resource]);
}

export const resourceReadPermissions: Record<string, string> = {
  users: 'users.read',
  roles: 'roles.read',
  permissions: 'permissions.read',
  plans: 'plans.read',
  tenants: 'tenants.read',
  settings: 'settings.read',
};
