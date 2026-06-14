import { reactive } from 'vue';
import { apiRequest } from '../services/api';
import { authState } from './auth';

type Branding = {
  name: string;
  logo: string | null;
};

type BrandingState = Branding & {
  loading: boolean;
};

export const brandingState = reactive<BrandingState>({
  name: 'MiControl',
  logo: null,
  loading: false,
});

function applyBranding(branding?: Partial<Branding> | null) {
  brandingState.name = branding?.name || authState.user?.tenant?.name || 'MiControl';
  brandingState.logo = branding?.logo || null;
}

export async function loadAuthenticatedBranding() {
  if (!authState.accessToken) {
    applyBranding(null);
    return;
  }

  brandingState.loading = true;

  try {
    const settings = await apiRequest<Array<Record<string, unknown>>>('/settings');
    const setting = settings[0] || {};
    applyBranding({
      name: String(setting.name || authState.user?.tenant?.name || 'MiControl'),
      logo: String(setting.logoIcon || setting.logo || setting.logoWhite || '') || null,
    });
  } catch {
    applyBranding(null);
  } finally {
    brandingState.loading = false;
  }
}

export async function loadPublicBranding(tenantSlug: string) {
  const slug = tenantSlug.trim();

  if (!slug) {
    applyBranding(null);
    return;
  }

  brandingState.loading = true;

  try {
    const branding = await apiRequest<Record<string, unknown>>(`/settings/branding/${encodeURIComponent(slug)}`);
    applyBranding({
      name: String(branding.name || 'MiControl'),
      logo: String(branding.logo || branding.logoIcon || branding.logoWhite || '') || null,
    });
  } catch {
    applyBranding(null);
  } finally {
    brandingState.loading = false;
  }
}
