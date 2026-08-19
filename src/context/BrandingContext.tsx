import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebsiteBranding } from '../types';
import { DEFAULT_BRANDING } from '../data/defaults';
import { supabase, getWebsiteBranding } from '../lib/supabase';

interface BrandingContextType {
  branding: WebsiteBranding;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  loading: false,
  refreshBranding: async () => {},
});

// Helper to convert hex to rgb string "r, g, b"
function hexToRgb(hex: string): string | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r}, ${g}, ${b}`;
    }
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r}, ${g}, ${b}`;
    }
  }
  return null;
}

// Function to apply branding to CSS variables, Favicon, and Document Title
function applyBrandingToDOM(branding: WebsiteBranding) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Set CSS Variables
  if (branding.primary_color) {
    root.style.setProperty('--brand-primary', branding.primary_color);
    const primaryRgb = hexToRgb(branding.primary_color);
    if (primaryRgb) {
      root.style.setProperty('--brand-primary-rgb', primaryRgb);
    }
  }

  if (branding.secondary_color) {
    root.style.setProperty('--brand-secondary', branding.secondary_color);
    const secondaryRgb = hexToRgb(branding.secondary_color);
    if (secondaryRgb) {
      root.style.setProperty('--brand-secondary-rgb', secondaryRgb);
    }
  }

  if (branding.accent_color) {
    root.style.setProperty('--brand-accent', branding.accent_color);
    const accentRgb = hexToRgb(branding.accent_color);
    if (accentRgb) {
      root.style.setProperty('--brand-accent-rgb', accentRgb);
    }
  }

  if (branding.text_color) {
    root.style.setProperty('--brand-text', branding.text_color);
  }

  // 2. Dynamic Favicon Update
  if (branding.favicon_url && branding.favicon_url.trim()) {
    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'shortcut icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = branding.favicon_url.trim();
  }

  // 3. Dynamic Page Title
  if (branding.site_name) {
    const siteName = branding.site_name.trim();
    const tagline = branding.tagline ? ` • ${branding.tagline.trim()}` : '';
    document.title = `${siteName}${tagline}`;
  }
}

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<WebsiteBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState<boolean>(false);

  // Apply default branding immediately on initialization (no flash)
  useEffect(() => {
    applyBrandingToDOM(DEFAULT_BRANDING);
  }, []);

  const fetchAndApplyBranding = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebsiteBranding();
      if (data) {
        setBranding(data);
        applyBrandingToDOM(data);
      }
    } catch (err) {
      console.warn('Branding load notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAndApplyBranding();
  }, [fetchAndApplyBranding]);

  // Realtime subscription to public.settings where key = 'website_branding'
  useEffect(() => {
    const channel = supabase
      .channel('public:settings_website_branding_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload: any) => {
          const updatedKey = payload.new?.key || payload.old?.key;
          if (!updatedKey || updatedKey === 'website_branding') {
            console.log('Realtime branding update detected from Supabase, refreshing...');
            fetchAndApplyBranding();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndApplyBranding]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        refreshBranding: fetchAndApplyBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      refreshBranding: async () => {},
    };
  }
  return context;
}
