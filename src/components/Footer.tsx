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
  return (
    <footer className="bg-[#071A0E] text-neutral-300 pt-16 pb-12 border-t border-[#0B3D20]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 mb-12 border-b border-[#0B3D20] text-neutral-200">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25">
            <div className="w-12 h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <Flame className="w-6 h-6 text-[#B7FF00]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Authentic Firewood Taste</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Cooked with traditional spices & natural smoke aroma</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25">
            <div className="w-12 h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <Truck className="w-6 h-6 text-[#B7FF00]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Hot & Fast Delivery</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Standard fee {formatNaira(settings.delivery_fee)} • Free over {formatNaira(settings.free_delivery_threshold || 25000)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#052E16]/90 border border-[#16A34A]/25">
            <div className="w-12 h-12 rounded-xl bg-[#16A34A]/20 text-[#B7FF00] flex items-center justify-center shrink-0 border border-[#16A34A]/30">
              <ShieldCheck className="w-6 h-6 text-[#B7FF00]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pay on Delivery</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Pay conveniently with cash or card upon package arrival</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#052E16] flex items-center justify-center text-white font-extrabold text-lg border border-[#B7FF00]/40">
                M
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-display">
                MUNAJ<span className="text-[#B7FF00]">.</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {settings.description ||
                'MUNAJ brings the rich, smoky, and soul-satisfying culinary heritage of Nigeria right to your table. Prepared fresh daily using authentic market ingredients.'}
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-400">
              <Clock className="w-4 h-4 text-[#B7FF00] shrink-0" />
              <span>{settings.opening_hours || 'Mon - Sun: 8:00 AM - 10:30 PM'}</span>
            </div>
          </div>

          {/* Popular Menus */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-sm tracking-wide uppercase mb-4">
              Popular Categories
            </h3>
            <ul className="space-y-2.5 text-xs">
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
                    className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-600" />
                    <span>{cat}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-sm tracking-wide uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('menu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> Full Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('account');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> Track Active Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> About Our Kitchen
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#B7FF00] text-neutral-300 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> Help & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-[#B7FF00] font-bold text-sm tracking-wide uppercase mb-4">
              Kitchen & Contact
            </h3>
            <ul className="space-y-3.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B7FF00] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B7FF00] shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-[#B7FF00] transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B7FF00] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-[#B7FF00] transition-colors">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#0B3D20] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} {settings.site_name} Foods Limited. All Rights Reserved.</p>
          <div className="flex items-center gap-1 text-neutral-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#B7FF00] fill-[#B7FF00]" />
            <span>for authentic Nigerian food lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
