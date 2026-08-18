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
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-neutral-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 border border-neutral-800 shadow-2xl">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 sm:py-20 lg:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-bold tracking-wide uppercase shadow-inner">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>Authentic Nigerian Kitchen</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-tight text-white">
              Real Nigerian Flavor. <br />
              <span className="text-amber-500">Made Fresh.</span>
            </h1>

            <p className="text-neutral-300 text-sm sm:text-base max-w-xl leading-relaxed">
              From smoky firewood jollof to rich soups, grills and suya — order your favorites fresh from MUNAJ.
            </p>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                id="hero-order-now-btn"
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-8 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all group cursor-pointer"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                className="bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 px-7 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Explore Menu</span>
              </button>
            </div>

            {/* Value Badges */}
            <div className="pt-6 border-t border-neutral-800/80 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-white">30-45m</div>
                <div className="text-[11px] text-neutral-400 font-medium">Fast Island & Mainland Delivery</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-400">100%</div>
                <div className="text-[11px] text-neutral-400 font-medium">Native Spices & Fresh Cuts</div>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-extrabold text-white">4.9 ★</div>
                <div className="text-[11px] text-neutral-400 font-medium">Trusted by Over 15,000+ Patrons</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900 group">
              <img
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1000&q=80"
                alt="MUNAJ Signature Firewood Jollof Rice"
                className="w-full aspect-4/3 sm:aspect-square object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>

              {/* Floating Chef Special Card */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                    Daily Special
                  </span>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    Firewood Party Jollof & Dodo
                  </h3>
                  <p className="text-xs text-neutral-400">Smoky, rich and served piping hot</p>
                </div>
                <button
                  onClick={() => {
                    const jollof = foodItems.find((f) => f.name.toLowerCase().includes('jollof'));
                    if (jollof) onOpenFoodModal(jollof);
                    else setCurrentTab('menu');
                  }}
                  className="bg-amber-500 text-neutral-950 p-2.5 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-md"
                  title="Add to Tray"
                >
                  <ShoppingBag className="w-4 h-4" />
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
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide mr-2">
                    {annc.title}:
                  </span>
                  <span className="text-xs font-medium text-neutral-800">
                    {annc.message}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Order Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 3. OUR MENU SECTION (Redesigned & dynamic) */}
      <section id="our-menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>OUR MENU</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 font-display tracking-tight">
              Made Fresh. Worth Coming Back For.
            </h2>
            <p className="text-neutral-600 text-sm max-w-2xl leading-relaxed">
              Explore our selection of Nigerian favorites, prepared fresh and packed with bold, authentic flavor.
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentTab('menu');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 self-start md:self-auto group"
          >
            <span>View Full Menu</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Dynamic Category Navigation & Search */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="home-food-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-white shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allCategoryTabs.map((catName) => {
              const isSelected = activeCategory.toLowerCase() === catName.toLowerCase();
              return (
                <button
                  key={catName}
                  onClick={() => setActiveCategory(catName)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
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
          <div className="text-center py-12 bg-white rounded-3xl border border-neutral-200 p-8 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="font-bold text-neutral-900 text-base">No dishes found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No menu items match your current selection. Try selecting "All Dishes" or clearing the search.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm shadow-md transition-all group"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
          </button>
        </div>
      </section>

      {/* 4. ACTIVE PROMOTIONS BANNER (If available) */}
      {promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Gift className="w-3.5 h-3.5" /> Special Offer
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight">
                {promotions[0].title}
              </h3>

              <p className="text-amber-50 text-xs sm:text-sm leading-relaxed">
                {promotions[0].description || 'Use your exclusive discount code during checkout to enjoy savings on your favourite meals.'}
              </p>

              {promotions[0].promo_code && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="bg-neutral-950/80 px-4 py-2.5 rounded-xl font-mono text-sm font-bold tracking-widest text-amber-300 border border-amber-300/30">
                    CODE: {promotions[0].promo_code}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentTab('menu');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white text-neutral-950 hover:bg-neutral-100 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-colors"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <ChefHat className="w-3.5 h-3.5" /> The MUNAJ Standard
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 font-display">
            Made Fresh. Served With Pride.
          </h2>
          <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
            Bold Nigerian flavors, fresh ingredients, and generous portions — prepared to order and delivered hot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-wide uppercase font-display">
              Freshly Prepared
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Made to order, never sitting around.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-wide uppercase font-display">
              Authentic Flavor
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Real Nigerian recipes and bold spices.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-wide uppercase font-display">
              Hot & Fast
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Prepared fresh and delivered with care.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-wide uppercase font-display">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> Customer Reviews
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
              Loved by Food Lovers
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-2">
              See what patrons say about our meals and delivery speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test) => (
              <div
                key={test.id}
                className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">
                    {Array.from({ length: test.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed italic">
                    "{test.message}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-neutral-100">
                  <img
                    src={test.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={test.customer_name}
                    className="w-10 h-10 rounded-full object-cover border border-amber-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900">
                      {test.customer_name}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-950 p-8 sm:p-12 text-center text-white relative overflow-hidden border border-neutral-800">
          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
              Ready to Order?
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm">
              Explore our freshly prepared dishes and get authentic Nigerian food delivered hot straight to your doorstep.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Menu</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
