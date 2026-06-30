import { reactive } from 'vue';
import { apiRequest } from '@/services/api';
import { authState } from './auth';

type Branding = {
  name: string;
  logo: string | null;
};

type BrandingState = Branding & {
  loading: boolean;
};

export const brandingState = reactive<BrandingState>({
  name: 'Organizarte',
  logo: null,
  loading: false,
});

let currentPageTitle: string | null = null;

export function setDocumentTitle(pageTitle?: string | null) {
  if (arguments.length > 0) {
    currentPageTitle = pageTitle || null;
  }

  const brandName = brandingState.name || 'Organizarte';
  document.title = currentPageTitle ? `${currentPageTitle} | ${brandName}` : brandName;
}

export function resetBranding() {
  brandingState.name = 'Organizarte';
  brandingState.logo = null;
  brandingState.loading = false;
  setDocumentTitle();
}

function applyBranding(branding?: Partial<Branding> | null) {
  brandingState.name = branding?.name || authState.user?.tenant?.name || 'Organizarte';
  brandingState.logo = branding?.logo || null;
  setDocumentTitle();
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
      name: String(setting.name || authState.user?.tenant?.name || 'Organizarte'),
      logo: String(setting.logo || setting.logoIcon || setting.logoWhite || '') || null,
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
    resetBranding();
    return;
  }

  brandingState.loading = true;

  try {
    const branding = await apiRequest<Record<string, unknown>>(`/settings/branding/${encodeURIComponent(slug)}`);
    applyBranding({
      name: String(branding.name || 'Organizarte'),
      logo: String(branding.logo || branding.logoIcon || branding.logoWhite || '') || null,
    });
  } catch {
    applyBranding(null);
  } finally {
    brandingState.loading = false;
  }
}
