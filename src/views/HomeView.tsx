import React, { useState, useMemo } from 'react';
import {
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Star,
  ChevronRight,
  Gift,
  Megaphone,
  ChefHat,
  ShoppingBag,
  Search,
  CheckCircle2,
  UtensilsCrossed,
  Truck,
  HeartHandshake,
} from 'lucide-react';
import {
  Category,
  FoodItem,
  Promotion,
  Announcement,
  Testimonial,
  WebsiteSettings,
  ViewTab,
} from '../types';
import { FoodCard } from '../components/FoodCard';
import { useBranding } from '../context/BrandingContext';

interface HomeViewProps {
  categories?: Category[];
  foodItems?: FoodItem[];
  promotions?: Promotion[];
  announcements?: Announcement[];
  testimonials?: Testimonial[];
  settings?: WebsiteSettings;
  setCurrentTab: (tab: ViewTab) => void;
  onSelectCategory: (categoryName: string) => void;
  onOpenFoodModal: (food: FoodItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  categories = [],
  foodItems = [],
  promotions = [],
  announcements = [],
  testimonials = [],
  settings,
  setCurrentTab,
  onSelectCategory,
  onOpenFoodModal,
}) => {
  const { branding } = useBranding();
  const siteName = branding.site_name || settings?.site_name || 'MUNAJ';
  const tagline = branding.tagline || 'GOOD FOOD. RIGHT TO YOUR DOOR.';
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamically filter food items based on category and search query
  const displayedFoods = useMemo(() => {
    return (foodItems || []).filter((item) => {
      // Category filter
      if (activeCategory !== 'all') {
        const cat = categories.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase());
        const catId = cat?.id;
        const matchCategory =
          (item.category_name && item.category_name.toLowerCase() === activeCategory.toLowerCase()) ||
          (catId && item.category_id === catId);
        if (!matchCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCategoryName = item.category_name?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCategoryName) return false;
      }

      return true;
    });
  }, [foodItems, activeCategory, searchQuery, categories]);

  const allCategoryTabs = ['all', ...categories.map((c) => c.name)];

  return (
    <div className="space-y-12 sm:space-y-20 lg:space-y-24 pb-16">
      {/* Broadcast Announcement Bar if active */}
      {announcements.length > 0 && (
        <div className="mx-3 sm:mx-6 lg:mx-8 -mb-8 sm:-mb-10 mt-3 sm:mt-4">
          <div className="bg-gradient-to-r from-[#0B3D20] via-[#052E16] to-[#0B3D20] border border-[#B7FF00]/40 rounded-2xl p-3 sm:p-4 sm:px-6 shadow-md flex items-center justify-between gap-3 sm:gap-4 text-white">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#052E16] border border-[#16A34A] text-[#B7FF00] flex items-center justify-center shrink-0">
                <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#B7FF00] flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="truncate">{announcements[0].title}</span>
                  <span className="text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#16A34A] text-white">
                    Announcement
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-neutral-200 line-clamp-1 mt-0.5">
                  {announcements[0].message}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#16A34A]/40 text-emerald-200 border border-[#16A34A]/60 px-2.5 py-1 rounded-full whitespace-nowrap hidden md:inline-block shrink-0">
              Latest Broadcast
            </span>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] text-white rounded-3xl mx-3 sm:mx-6 lg:mx-8 mt-3 sm:mt-6 border border-[#16A34A]/30 shadow-2xl">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 sm:w-96 h-72 sm:h-96 bg-[#16A34A]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 sm:w-80 h-64 sm:h-80 bg-[#B7FF00]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#052E16]/90 border border-[#16A34A]/50 text-[#B7FF00] text-[11px] sm:text-xs font-bold tracking-wide uppercase shadow-inner">
              <Flame className="w-3.5 h-3.5 fill-[#B7FF00] text-[#B7FF00]" />
              <span>Authentic Nigerian Kitchen</span>
            </div>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15] text-white">
              Real Nigerian Flavor. <br />
              <span className="text-[#B7FF00]">Made Fresh.</span>
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-base max-w-xl leading-relaxed">
              From smoky firewood jollof to rich soups, grills and suya — order your favorites fresh from {siteName}.
            </p>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="hero-order-now-btn"
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/30 hover:shadow-[#16A34A]/40 transition-all group cursor-pointer border border-[#B7FF00]/30"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4 text-[#B7FF00] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-explore-menu-btn"
                onClick={() => {
                  const menuSection = document.getElementById('our-menu-section');
                  if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setCurrentTab('menu');
                  }
                }}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer backdrop-blur-xs"
              >
                <span>Explore Menu</span>
              </button>
            </div>

            {/* Value Badges */}
            <div className="pt-5 border-t border-emerald-800/60 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
              <div>
                <div className="text-base sm:text-xl font-extrabold text-white">30-45m</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-200/80 font-medium leading-tight mt-0.5">Fast Island & Mainland Delivery</div>
              </div>
              <div>
                <div className="text-base sm:text-xl font-extrabold text-[#B7FF00]">100%</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-200/80 font-medium leading-tight mt-0.5">Native Spices & Fresh Cuts</div>
              </div>
              <div>
                <div className="text-base sm:text-xl font-extrabold text-white">4.9 ★</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-200/80 font-medium leading-tight mt-0.5">Trusted by Over 15,000+ Patrons</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/60 bg-emerald-950 group">
              <img
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1000&q=80"
                alt="MUNAJ Signature Firewood Jollof Rice"
                className="w-full aspect-4/3 sm:aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#052E16] via-transparent to-transparent"></div>

              {/* Floating Chef Special Card */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#052E16]/90 backdrop-blur-md border border-[#16A34A]/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#B7FF00] font-extrabold">
                    Daily Special
                  </span>
                  <h3 className="font-bold text-white text-xs sm:text-base truncate">
                    Firewood Party Jollof & Dodo
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-200/80 line-clamp-1">Smoky, rich and served piping hot</p>
                </div>
                <button
                  onClick={() => {
                    const jollof = foodItems.find((f) => f.name.toLowerCase().includes('jollof'));
                    if (jollof) onOpenFoodModal(jollof);
                    else setCurrentTab('menu');
                  }}
                  className="bg-[#16A34A] text-white p-2 sm:p-2.5 rounded-xl font-bold hover:bg-[#15803D] transition-colors shadow-md shrink-0"
                  title="Add to Tray"
                >
                  <ShoppingBag className="w-4 h-4 text-[#B7FF00]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ANNOUNCEMENTS BANNER (If available from Supabase) */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {announcements.map((annc) => (
            <div
              key={annc.id}
              className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#16A34A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#052E16] uppercase tracking-wide mr-2">
                    {annc.title}:
                  </span>
                  <span className="text-xs font-medium text-emerald-950">
                    {annc.message}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-[#16A34A] hover:text-[#0B3D20] flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Order Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 3. OUR MENU SECTION (Redesigned & dynamic) */}
      <section id="our-menu-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>OUR MENU</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#052E16] font-display tracking-tight">
              Made Fresh. Worth Coming Back For.
            </h2>
            <p className="text-neutral-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Explore our selection of Nigerian favorites, prepared fresh and packed with bold, authentic flavor.
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentTab('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-[#16A34A] hover:text-[#0B3D20] flex items-center gap-1 self-start md:self-auto group cursor-pointer"
          >
            <span>View Full Menu</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Dynamic Category Navigation & Search */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="home-food-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-white shadow-2xs transition-all text-[#052E16]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-full">
            {allCategoryTabs.map((catName) => {
              const isSelected = activeCategory.toLowerCase() === catName.toLowerCase();
              return (
                <button
                  key={catName}
                  onClick={() => setActiveCategory(catName)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#052E16] text-[#B7FF00] border border-[#16A34A]/50 shadow-xs'
                      : 'bg-white text-emerald-950 border border-emerald-100 hover:border-emerald-300 hover:bg-[#F0FDF4]'
                  }`}
                >
                  {catName === 'all' ? 'All Dishes' : catName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic 3-Column Food Grid */}
        {displayedFoods.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-[#052E16] text-base">No dishes found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No menu items match your current selection. Try selecting "All Dishes" or clearing the search.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="bg-[#16A34A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#15803D] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedFoods.slice(0, 9).map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onOpenDetails={onOpenFoodModal}
              />
            ))}
          </div>
        )}

        {/* View Full Menu CTA Link */}
        <div className="pt-4 text-center">
          <button
            onClick={() => {
              setCurrentTab('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/10 transition-all group cursor-pointer"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#B7FF00]" />
          </button>
        </div>
      </section>

      {/* 4. ACTIVE PROMOTIONS BANNER (If available) */}
      {promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B3D20] via-[#16A34A] to-[#052E16] text-white p-5 sm:p-8 lg:p-12 shadow-xl relative overflow-hidden border border-[#B7FF00]/30">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#B7FF00] text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Gift className="w-3.5 h-3.5" /> Special Offer
              </div>

              <h3 className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight">
                {promotions[0].title}
              </h3>

              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                {promotions[0].description || 'Use your exclusive discount code during checkout to enjoy savings on your favourite meals.'}
              </p>

              {promotions[0].promo_code && (
                <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <div className="bg-[#052E16]/90 px-3.5 sm:px-4 py-2 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-widest text-[#B7FF00] border border-[#B7FF00]/40">
                    CODE: {promotions[0].promo_code}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab('menu');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-[#B7FF00] text-[#052E16] hover:bg-[#a3e600] font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Claim Discount Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. MODERN TRUST FEATURES: Made Fresh. Served With Pride. */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
            <ChefHat className="w-3.5 h-3.5" /> The MUNAJ Standard
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#052E16] font-display">
            Made Fresh. Served With Pride.
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
            Bold Nigerian flavors, fresh ingredients, and generous portions — prepared to order and delivered hot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Feature 1 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition-shadow space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#052E16] tracking-wide uppercase font-display">
              Freshly Prepared
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Made to order, never sitting around.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition-shadow space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-[#16A34A]" />
            </div>
            <h4 className="font-bold text-sm text-[#052E16] tracking-wide uppercase font-display">
              Authentic Flavor
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Real Nigerian recipes and bold spices.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition-shadow space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#052E16] tracking-wide uppercase font-display">
              Hot & Fast
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Prepared fresh and delivered with care.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition-shadow space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-center text-[#16A34A]">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#052E16] tracking-wide uppercase font-display">
              Quality Ingredients
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Only ingredients we'd serve at our own table.
            </p>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION */}
      {testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-[#16A34A] text-[#16A34A]" /> Customer Reviews
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#052E16] font-display">
              Loved by Food Lovers
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-2">
              See what patrons say about our meals and delivery speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((test) => (
              <div
                key={test.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#16A34A] mb-3 sm:mb-4">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#16A34A] text-[#16A34A]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                    "{test.message}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-emerald-50">
                  <img
                    src={test.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={test.customer_name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-emerald-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#052E16]">
                      {test.customer_name}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-neutral-500">
                      {test.role_or_location || 'Verified Patron'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. BOTTOM CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] p-6 sm:p-10 lg:p-12 text-center text-white relative overflow-hidden border border-[#16A34A]/40 shadow-xl">
          <div className="max-w-xl mx-auto space-y-3 sm:space-y-4 relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display">
              Ready to Order?
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm">
              Explore our freshly prepared dishes and get authentic Nigerian food delivered hot straight to your doorstep.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-8 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 border border-[#B7FF00]/30 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#B7FF00]" />
                <span>Browse Menu</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
