import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, FoodItem } from '../types';
import { FoodCard } from '../components/FoodCard';

interface MenuViewProps {
  categories?: Category[];
  foodItems?: FoodItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onOpenFoodModal: (food: FoodItem) => void;
  loading?: boolean;
}

export const MenuView: React.FC<MenuViewProps> = ({
  categories = [],
  foodItems = [],
  selectedCategory,
  setSelectedCategory,
  onOpenFoodModal,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  // Filter & Sort Logic
  const filteredFoods = useMemo(() => {
    return (foodItems || [])
      .filter((item) => {
        // Category match
        if (selectedCategory && selectedCategory !== 'all') {
          const cat = (categories || []).find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase());
          const catId = cat?.id;
          const matchCat =
            (item.category_name && item.category_name.toLowerCase() === selectedCategory.toLowerCase()) ||
            (catId && item.category_id === catId);
          if (!matchCat) return false;
        }

        // Availability match
        if (onlyAvailable && !item.available) {
          return false;
        }

        // Search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCat = item.category_name?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Default 'featured'
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [foodItems, selectedCategory, onlyAvailable, searchQuery, sortBy, categories]);

  const allCategoryNames = ['all', ...(categories || []).map((c) => c.name)];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 border border-[#16A34A]/30 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#B7FF00] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Freshly Prepared Menu
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
            The MUNAJ Food Selection
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Browse our wide selection of firewood party jollof, traditional swallows with assorted soups, sizzling Hausa suya, small chops, and ice-cold refreshments.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="menu-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jollof, egusi, suya, soup..."
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 transition-all text-[#052E16]"
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

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Availability Toggle */}
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[#052E16] cursor-pointer select-none bg-[#F0FDF4] px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-emerald-200 shrink-0">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-[#16A34A] focus:ring-[#16A34A] h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <span className="text-[11px] sm:text-xs">Available Only</span>
          </label>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F0FDF4] px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-200 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-[#052E16] outline-hidden cursor-pointer"
            >
              <option value="featured">Sort: Chef's Specials</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-full">
        {allCategoryNames.map((catName) => {
          const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
          return (
            <button
              key={catName}
              id={`cat-filter-${catName.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(catName)}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#052E16] text-[#B7FF00] border border-[#16A34A]/50 shadow-md'
                  : 'bg-white text-emerald-950 border border-emerald-100 hover:border-emerald-300 hover:bg-[#F0FDF4]'
              }`}
            >
              {catName === 'all' ? 'All Dishes' : catName}
            </button>
          );
        })}
      </div>

      {/* Food Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-4 animate-pulse"
            >
              <div className="aspect-4/3 bg-emerald-50 rounded-xl"></div>
              <div className="h-4 bg-emerald-50 rounded w-3/4"></div>
              <div className="h-3 bg-emerald-50 rounded w-full"></div>
              <div className="h-6 bg-emerald-50 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto border border-emerald-200">
            <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#052E16]">No matching dishes found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            We couldn't find any dishes matching your search or filters. Try adjusting your search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setOnlyAvailable(false);
            }}
            className="inline-flex items-center gap-2 bg-[#16A34A] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#15803D] transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onOpenDetails={onOpenFoodModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
