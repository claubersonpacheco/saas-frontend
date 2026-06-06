export type Permission = {
  id: number;
  name: string;
  description?: string | null;
};

export type Role = {
  id: number;
  tenantId?: number;
  name: string;
  description?: string | null;
  permissions?: Permission[];
};

export type Plan = {
  id: number;
  name: string;
  slug: string;
  projectType: string;
  description?: string | null;
  modules?: string[];
  active: boolean;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  planId?: number | null;
  plan?: Plan | null;
};

export type User = {
  id: number;
  tenantId: number;
  username: string;
  name: string;
  lastname?: string | null;
  email: string;
  suspended?: string;
  photoUrl?: string | null;
  role?: Role | null;
  tenant?: Tenant | null;
};

export type Setting = {
  id: number;
  tenantId: number;
  name?: string | null;
  logo?: string | null;
  logoIcon?: string | null;
  logoPrint?: string | null;
  logoWhite?: string | null;
  bunnyStorageZoneName?: string | null;
  bunnyStorageAccessKey?: string | null;
  bunnyStorageCdnDomain?: string | null;
  bunnyStorageBaseUrl?: string | null;
  bunnyStorageUserFolder?: string | null;
  bunnyStorageLogoFolder?: string | null;
};
