import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Flame,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { ViewTab, WebsiteSettings } from '../types';
import { formatNaira } from '../lib/supabase';
import { useBranding } from '../context/BrandingContext';

interface FooterProps {
  settings: WebsiteSettings;
  setCurrentTab: (tab: ViewTab) => void;
  onSelectCategory?: (categoryName: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  setCurrentTab,
  onSelectCategory,
}) => {
  const { branding } = useBranding();
  const effectiveSiteName = branding.site_name || settings.site_name || 'MUNAJ Foods';
  const effectiveTagline = branding.tagline || 'GOOD FOOD. RIGHT TO YOUR DOOR.';
  return (
    <footer className="bg-[#071A0E] text-neutral-300 pt-10 sm:pt-16 pb-8 sm:pb-12 border-t border-[#0B3D20] w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 pb-8 sm:pb-12 mb-8 sm:mb-12 border-b border-[#0B3D20] text-neutral-200">
          <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#B7FF00]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">Authentic Firewood Taste</h4>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-snug">Cooked with traditional spices & natural smoke aroma</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-[#B7FF00]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">Hot & Fast Delivery</h4>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-snug">
                Standard {formatNaira(settings.delivery_fee)} • Free over {formatNaira(settings.free_delivery_threshold || 25000)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#B7FF00]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">Pay on Delivery</h4>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-snug">Pay conveniently with cash or card upon package arrival</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
          {/* Brand Col */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {branding.logo_url && branding.logo_url.trim() ? (
                <img
                  src={branding.logo_url.trim()}
                  alt={effectiveSiteName}
                  className="h-8 sm:h-10 w-auto max-w-[120px] object-contain shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallbackEl = document.getElementById('footer-logo-fallback');
                    if (fallbackEl) fallbackEl.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                id="footer-logo-fallback"
                style={{ display: branding.logo_url && branding.logo_url.trim() ? 'none' : 'flex' }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#052E16] items-center justify-center text-white font-extrabold text-base sm:text-lg border border-[#B7FF00]/40 shrink-0"
              >
                {effectiveSiteName.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-display truncate">
                {effectiveSiteName}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {settings.description ||
                `${effectiveSiteName} brings the rich, smoky, and soul-satisfying culinary heritage of authentic cuisine right to your table. Prepared fresh daily using authentic market ingredients.`}
            </p>
            <div className="pt-1 sm:pt-2 flex items-center gap-2.5 text-xs text-neutral-400">
              <Clock className="w-4 h-4 text-[#B7FF00] shrink-0" />
              <span>{settings.opening_hours || 'Mon - Sun: 8:00 AM - 10:30 PM'}</span>
            </div>
          </div>

          {/* Popular Menus */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4">
              Popular Categories
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs">
              {[
                'Rice & Grains',
                'Traditional Soups & Swallows',
                'Grills & Suya Corner',
                'Pepper Soups & Special Pots',
                'Small Chops & Finger Foods',
                'Beverages & Local Drinks',
              ].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat);
                      setCurrentTab('menu');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{cat}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" /> Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('menu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" /> Full Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('account');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" /> Track Active Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" /> About Our Kitchen
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600 shrink-0" /> Help & Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-[#B7FF00] shrink-0" /> Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-xs sm:text-sm tracking-wide uppercase mb-3 sm:mb-4">
              Kitchen & Contact
            </h3>
            <ul className="space-y-3 text-xs text-neutral-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B7FF00] shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.address || 'No. 15 Dada Street, Oshodi, Lagos, Nigeria'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B7FF00] shrink-0" />
                <a
                  href={`tel:${(settings.phone || '+234 806 454 4421').replace(/\s+/g, '')}`}
                  className="hover:text-[#B7FF00] transition-colors truncate"
                >
                  {settings.phone || '+234 806 454 4421'}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B7FF00] shrink-0" />
                <a
                  href={`mailto:${settings.email || 'ogonnayaomoke80@gmail.com'}`}
                  className="hover:text-[#B7FF00] transition-colors truncate"
                >
                  {settings.email || 'ogonnayaomoke80@gmail.com'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 border-t border-[#0B3D20] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3 sm:gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {effectiveSiteName}. All Rights Reserved.</p>
          <div className="flex items-center justify-center gap-1 text-neutral-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#B7FF00] fill-[#B7FF00]" />
            <span>for authentic Nigerian food lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
