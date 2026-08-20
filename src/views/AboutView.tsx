import React from 'react';
import { Flame, ChefHat, Heart, Award, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { WebsiteSettings, ViewTab } from '../types';
import { useBranding } from '../context/BrandingContext';

interface AboutViewProps {
  settings: WebsiteSettings;
  setCurrentTab: (tab: ViewTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ settings, setCurrentTab }) => {
  const { branding } = useBranding();
  const siteName = branding.site_name || settings.site_name || 'MUNAJ';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 fill-amber-600 text-amber-600" /> The {siteName} Story
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 font-display leading-tight">
          Preserving the Authentic Heritage of Nigerian Firewood Cooking
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          At {siteName}, we believe that true authentic cuisine cannot be rushed or imitated. We honor time-tested cooking methods, natural open wood fires, and indigenous spices to deliver unforgettable dining experiences.
        </p>
      </div>

      {/* Visual story banner */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 aspect-16/9 sm:aspect-21/9 relative bg-neutral-900">
        <img
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80"
          alt="MUNAJ Firewood Kitchen"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent flex items-end p-6 sm:p-12">
          <div className="max-w-2xl text-white space-y-2">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              From Cast-Iron Pots to Your Table
            </span>
            <h3 className="text-xl sm:text-3xl font-extrabold font-display">
              Uncompromising Quality in Every Pot
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300">
              Stone-ground egusi, unbleached pure palm oil, hand-cut beef suya with northern Yaji spice, and fresh point-and-kill catfish.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Pillar Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-neutral-900 font-display">
            The Firewood Secret
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Our party Jollof is slow-cooked over hardwood logs. This imparts that legendary bottom-pot smokiness you only find at grand celebratory gatherings.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-neutral-900 font-display">
            Master Native Chefs
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Every dish is guided by culinary masters from Yoruba, Igbo, and Hausa traditions who understand authentic recipes passed through generations.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-neutral-900 font-display">
            Freshness Guaranteed
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            We cook in small daily batches using locally sourced produce from trusted farms, sealed in hygienic food-grade thermal containers.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-neutral-900 rounded-3xl p-8 sm:p-12 text-center text-white space-y-4">
        <h3 className="text-2xl sm:text-3xl font-extrabold font-display">
          Experience the Feast Firsthand
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
          Order for family, office lunches, or celebrations and taste the authentic pride of Nigerian cooking.
        </p>
        <button
          onClick={() => {
            setCurrentTab('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-colors"
        >
          <span>Explore Today's Menu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
