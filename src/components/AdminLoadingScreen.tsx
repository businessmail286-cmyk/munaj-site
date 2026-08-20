import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../context/BrandingContext';

interface AdminLoadingScreenProps {
  onComplete: () => void;
  adminName?: string;
}

// Design Palette Constants
const COLORS = {
  bg: '#FFF6E9',
  bgGlow: '#FFEBC7',
  mainText: '#3A2B1E',
  softText: '#A5876B',
  card: '#FFFFFF',
  red: '#FF5B4C',
  orange: '#FF9A3D',
  gold: '#FFC93D',
  teal: '#33B2A6',
  pink: '#FF6FA0',
  line: '#F2DFC1',
};

const EASE_BEZIER = [0.22, 1, 0.36, 1] as const;

// 15-Second Timeline Configuration (7 distinct steps + final completion)
const TIMELINE_STEPS = [
  {
    id: 'step-0',
    food: 'burger',
    ringColor: COLORS.red,
    message: 'Welcome back, Admin…',
    progressIndex: 0,
    durationMs: 2000,
  },
  {
    id: 'step-1',
    food: 'pizza',
    ringColor: COLORS.orange,
    message: 'Verifying your access…',
    progressIndex: 1,
    durationMs: 2000,
  },
  {
    id: 'step-2',
    food: 'fries',
    ringColor: COLORS.gold,
    message: 'Securing your dashboard…',
    progressIndex: 2,
    durationMs: 2000,
  },
  {
    id: 'step-3',
    food: 'drink',
    ringColor: COLORS.teal,
    message: 'Syncing restaurant data…',
    progressIndex: 3,
    durationMs: 2000,
  },
  {
    id: 'step-4',
    food: 'donut',
    ringColor: COLORS.pink,
    message: 'Loading food inventory…',
    progressIndex: 4,
    durationMs: 2000,
  },
  {
    id: 'step-5',
    food: 'burger',
    ringColor: COLORS.red,
    message: 'Preparing today’s orders…',
    progressIndex: 5,
    durationMs: 2000,
  },
  {
    id: 'step-6',
    food: 'pizza',
    ringColor: COLORS.orange,
    message: 'Generating your dashboard…',
    progressIndex: 6,
    durationMs: 2000,
  },
  {
    id: 'step-7',
    food: 'final',
    ringColor: COLORS.teal,
    message: 'Your dashboard is ready.',
    progressIndex: 6,
    durationMs: 1200,
  },
];

// SVG Food Components
const BurgerSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top Bun */}
    <path
      d="M12 30C12 18.9543 20.9543 10 32 10C43.0457 10 52 18.9543 52 30C52 31.1046 51.1046 32 50 32H14C12.8954 32 12 31.1046 12 30Z"
      fill="#FF9A3D"
    />
    <path
      d="M14 29C14.5 19 22.5 12 32 12C41.5 12 49.5 19 50 29H14Z"
      fill="#FFAD5A"
      opacity="0.6"
    />
    {/* Sesame Seeds */}
    <ellipse cx="24" cy="18" rx="1.5" ry="0.8" fill="#FFF6E9" transform="rotate(-15 24 18)" />
    <ellipse cx="33" cy="16" rx="1.5" ry="0.8" fill="#FFF6E9" />
    <ellipse cx="41" cy="19" rx="1.5" ry="0.8" fill="#FFF6E9" transform="rotate(20 41 19)" />
    <ellipse cx="28" cy="23" rx="1.5" ry="0.8" fill="#FFF6E9" transform="rotate(5 28 23)" />
    <ellipse cx="37" cy="23" rx="1.5" ry="0.8" fill="#FFF6E9" transform="rotate(-10 37 23)" />

    {/* Tomato Slices */}
    <rect x="13" y="32" width="38" height="4" rx="2" fill="#FF5B4C" />

    {/* Melted Cheese Slice */}
    <path
      d="M11 36H53L48 43H36L31 46L26 43H16L11 36Z"
      fill="#FFC93D"
    />

    {/* Grilled Beef Patty */}
    <rect x="12" y="41" width="40" height="7" rx="3.5" fill="#3A2B1E" />
    <line x1="16" y1="44.5" x2="48" y2="44.5" stroke="#5C3A21" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

    {/* Lettuce Frill */}
    <path
      d="M10 47C13 45 16 48 19 47C22 46 25 48.5 28 47C31 45.5 34 48 37 47C40 46 43 48.5 46 47C49 45.5 52 48 54 47V49H10V47Z"
      fill="#33B2A6"
    />

    {/* Bottom Bun */}
    <path
      d="M14 49H50C51.6569 49 53 50.3431 53 52C53 54.7614 50.7614 57 48 57H16C13.2386 57 11 54.7614 11 52C11 50.3431 12.3431 49 14 49Z"
      fill="#E8A246"
    />
  </svg>
);

const PizzaSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Crust Arc */}
    <path
      d="M12 18C23 12 41 12 52 18C53.5 19 54 21 52.8 22.5L34 54C33 55.5 31 55.5 30 54L11.2 22.5C10 21 10.5 19 12 18Z"
      fill="#FF9A3D"
    />
    {/* Cheese Fill */}
    <path
      d="M15 21C24 16 40 16 49 21L32 50L15 21Z"
      fill="#FFC93D"
    />
    <path
      d="M17 22C25 18 39 18 47 22L32 47L17 22Z"
      fill="#FFE082"
      opacity="0.7"
    />

    {/* Pepperoni Slices */}
    <circle cx="28" cy="27" r="4.5" fill="#FF5B4C" />
    <circle cx="27" cy="26" r="1.5" fill="#FFEBC7" opacity="0.6" />

    <circle cx="39" cy="30" r="4" fill="#FF5B4C" />
    <circle cx="38" cy="29" r="1.2" fill="#FFEBC7" opacity="0.6" />

    <circle cx="32" cy="39" r="3.5" fill="#FF5B4C" />
    <circle cx="31.5" cy="38.5" r="1" fill="#FFEBC7" opacity="0.6" />

    {/* Basil Leaf / Seasoning Accents */}
    <ellipse cx="23" cy="34" rx="2" ry="1.2" fill="#33B2A6" transform="rotate(-30 23 34)" />
    <ellipse cx="38" cy="22" rx="1.8" ry="1" fill="#33B2A6" transform="rotate(40 38 22)" />
    <circle cx="34" cy="31" r="1" fill="#3A2B1E" opacity="0.5" />
    <circle cx="26" cy="42" r="0.8" fill="#3A2B1E" opacity="0.5" />
  </svg>
);

const FriesSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Golden French Fries Sticks */}
    <rect x="18" y="10" width="5.5" height="28" rx="2" fill="#FFC93D" transform="rotate(-10 18 10)" />
    <rect x="25" y="7" width="5.5" height="30" rx="2" fill="#FFE082" transform="rotate(-3 25 7)" />
    <rect x="33" y="6" width="5.5" height="31" rx="2" fill="#FFC93D" transform="rotate(4 33 6)" />
    <rect x="41" y="9" width="5.5" height="28" rx="2" fill="#FFE082" transform="rotate(12 41 9)" />

    <rect x="22" y="12" width="4.5" height="24" rx="1.5" fill="#FF9A3D" transform="rotate(-6 22 12)" />
    <rect x="37" y="11" width="4.5" height="25" rx="1.5" fill="#FF9A3D" transform="rotate(8 37 11)" />
    <rect x="29" y="8" width="5" height="28" rx="2" fill="#FFF6E9" opacity="0.7" transform="rotate(1 29 8)" />

    {/* Fry Box Back */}
    <path
      d="M15 32L20 54C20.5 56 22 57 24 57H40C42 57 43.5 56 44 54L49 32H15Z"
      fill="#E53E3E"
    />

    {/* Fry Box Front / Curved Pocket */}
    <path
      d="M15 34L20 54C20.5 56 22 57 24 57H40C42 57 43.5 56 44 54L49 34C44 38 37 40 32 40C27 40 20 38 15 34Z"
      fill="#FF5B4C"
    />

    {/* Box Gold Brand Emblem */}
    <circle cx="32" cy="48" r="4.5" fill="#FFC93D" />
    <path
      d="M30 50L32 45L34 50"
      stroke="#3A2B1E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DrinkSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bendy Striped Straw */}
    <path
      d="M34 26L38 8L46 11"
      stroke="#FF5B4C"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34 26L38 8L46 11"
      stroke="#FFFFFF"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="3 3"
    />

    {/* Cup Body Container */}
    <path
      d="M19 26L23 54C23.5 56 25 57 27 57H37C39 57 40.5 56 41 54L45 26H19Z"
      fill="#33B2A6"
    />

    {/* Liquid Depth */}
    <path
      d="M20.5 32L23 53C23.3 54.8 24.8 55.5 26.5 55.5H37.5C39.2 55.5 40.7 54.8 41 53L43.5 32H20.5Z"
      fill="#268E84"
    />

    {/* Ice Cubes */}
    <rect x="25" y="35" width="6" height="6" rx="1.5" fill="#FFFFFF" opacity="0.55" transform="rotate(12 25 35)" />
    <rect x="33" y="42" width="5.5" height="5.5" rx="1.5" fill="#FFFFFF" opacity="0.45" transform="rotate(-8 33 42)" />

    {/* Bubbles */}
    <circle cx="26" cy="47" r="1.2" fill="#FFFFFF" opacity="0.7" />
    <circle cx="38" cy="36" r="1.5" fill="#FFFFFF" opacity="0.6" />
    <circle cx="31" cy="51" r="1" fill="#FFFFFF" opacity="0.7" />

    {/* Cup Lid */}
    <path
      d="M16 26C16 24.3431 17.3431 23 19 23H45C46.6569 23 48 24.3431 48 26C48 26.5523 47.5523 27 47 27H17C16.4477 27 16 26.5523 16 26Z"
      fill="#FFEBC7"
    />
    <rect x="23" y="21" width="18" height="3" rx="1.5" fill="#F2DFC1" />
  </svg>
);

const DonutSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pastry Dough */}
    <ellipse cx="32" cy="33" rx="22" ry="20" fill="#E8A246" />
    <ellipse cx="32" cy="31" rx="21" ry="19" fill="#FFC93D" />

    {/* Pink Strawberry Glaze with Drips */}
    <path
      d="M12 31C12 20 21 12 32 12C43 12 52 20 52 31C52 34 50 35 48 34C46 33 45 37 43 38C41 39 39 36 37 37C35 38 34 41 31 41C28 41 27 38 25 38C23 38 22 41 19 40C16 39 15 35 13 34C12 33.5 12 32 12 31Z"
      fill="#FF6FA0"
    />
    <path
      d="M14 29C14 20 22 14 32 14C42 14 50 20 50 29C49 23 41 16 32 16C23 16 15 23 14 29Z"
      fill="#FF8FB6"
      opacity="0.6"
    />

    {/* Center Hole */}
    <ellipse cx="32" cy="31" rx="7.5" ry="6.5" fill="#FFF6E9" />
    <ellipse cx="32" cy="32.5" rx="7.5" ry="6.5" fill="#A5876B" opacity="0.3" />
    <ellipse cx="32" cy="31" rx="6.5" ry="5.5" fill="#FFF6E9" />

    {/* Colorful Sprinkles */}
    {/* Teal */}
    <rect x="20" y="19" width="4.5" height="1.8" rx="0.9" fill="#33B2A6" transform="rotate(35 20 19)" />
    <rect x="42" y="24" width="4.5" height="1.8" rx="0.9" fill="#33B2A6" transform="rotate(-25 42 24)" />
    <rect x="28" y="38" width="4" height="1.6" rx="0.8" fill="#33B2A6" transform="rotate(45 28 38)" />

    {/* Gold */}
    <rect x="27" y="16" width="4.5" height="1.8" rx="0.9" fill="#FFC93D" transform="rotate(-15 27 16)" />
    <rect x="36" y="17" width="4.5" height="1.8" rx="0.9" fill="#FFC93D" transform="rotate(20 36 17)" />
    <rect x="44" y="32" width="4" height="1.6" rx="0.8" fill="#FFC93D" transform="rotate(-40 44 32)" />

    {/* White */}
    <rect x="18" y="26" width="4" height="1.6" rx="0.8" fill="#FFFFFF" transform="rotate(-45 18 26)" />
    <rect x="23" y="34" width="4" height="1.6" rx="0.8" fill="#FFFFFF" transform="rotate(10 23 34)" />
    <rect x="38" y="36" width="4" height="1.6" rx="0.8" fill="#FFFFFF" transform="rotate(-15 38 36)" />

    {/* Red */}
    <rect x="43" y="19" width="4" height="1.6" rx="0.8" fill="#FF5B4C" transform="rotate(50 43 19)" />
    <rect x="15" y="32" width="3.5" height="1.5" rx="0.75" fill="#FF5B4C" transform="rotate(20 15 32)" />
  </svg>
);

const FinalFoodSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Golden Serving Platter / Cloche Base */}
    <path
      d="M10 47C10 45.3431 11.3431 44 13 44H51C52.6569 44 54 45.3431 54 47C54 48.6569 52.6569 50 51 50H13C11.3431 50 10 48.6569 10 47Z"
      fill="#FFC93D"
    />
    <rect x="8" y="49" width="48" height="3" rx="1.5" fill="#FF9A3D" />

    {/* Dome / Cloche Cover */}
    <path
      d="M14 43C14 26 22 18 32 18C42 18 50 26 50 43H14Z"
      fill="#FFC93D"
    />
    <path
      d="M16 41C16 27 23 20 32 20C41 20 48 27 48 41H16Z"
      fill="#FFE082"
      opacity="0.8"
    />
    {/* Cloche Highlight */}
    <path
      d="M20 38C20 28 25 23 30 22C24 24 21 29 21 38H20Z"
      fill="#FFFFFF"
      opacity="0.7"
    />

    {/* Top Handle Ring */}
    <circle cx="32" cy="15" r="3.5" fill="#FF9A3D" />
    <circle cx="32" cy="15" r="2" fill="#FFC93D" />

    {/* Readiness Sparkles */}
    <path
      d="M32 4L33.2 8.8L38 10L33.2 11.2L32 16L30.8 11.2L26 10L30.8 8.8L32 4Z"
      fill="#33B2A6"
    />
    <path
      d="M12 24L12.8 26.8L16 27.5L12.8 28.2L12 31L11.2 28.2L8 27.5L11.2 26.8L12 24Z"
      fill="#FF9A3D"
    />
    <path
      d="M52 24L52.8 26.8L56 27.5L52.8 28.2L52 31L51.2 28.2L48 27.5L51.2 26.8L52 24Z"
      fill="#FF5B4C"
    />
  </svg>
);

export const AdminLoadingScreen: React.FC<AdminLoadingScreenProps> = ({
  onComplete,
}) => {
  const { branding } = useBranding();
  const siteName = branding.site_name || 'MUNAJ Foods';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Lock body scroll during admin loader
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Timeline engine running precisely for ~15 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentStepIndex < TIMELINE_STEPS.length - 1) {
      const currentStepDuration = TIMELINE_STEPS[currentStepIndex].durationMs;
      timeoutId = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, currentStepDuration);
    } else {
      // Final step: hold "Your dashboard is ready." briefly, then initiate smooth exit transition
      timeoutId = setTimeout(() => {
        setIsExiting(true);
        // Smooth transition around 0.75 seconds before revealing dashboard
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 750);
        return () => clearTimeout(exitTimer);
      }, TIMELINE_STEPS[currentStepIndex].durationMs);
    }

    return () => clearTimeout(timeoutId);
  }, [currentStepIndex, onComplete]);

  const activeStep = TIMELINE_STEPS[currentStepIndex] || TIMELINE_STEPS[0];

  // Render the single active food SVG based on activeStep
  const renderedFoodSvg = useMemo(() => {
    switch (activeStep.food) {
      case 'burger':
        return <BurgerSvg />;
      case 'pizza':
        return <PizzaSvg />;
      case 'fries':
        return <FriesSvg />;
      case 'drink':
        return <DrinkSvg />;
      case 'donut':
        return <DonutSvg />;
      case 'final':
        return <FinalFoodSvg />;
      default:
        return <BurgerSvg />;
    }
  }, [activeStep.food]);

  return (
    <div
      id="munaj-admin-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading MUNAJ Admin Dashboard"
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ${
        isExiting
          ? 'opacity-0 scale-[0.96] blur-xs pointer-events-none'
          : 'opacity-100 scale-100 blur-none'
      }`}
      style={{
        backgroundColor: COLORS.bg,
        height: '100dvh',
        minHeight: '100vh',
        width: '100vw',
      }}
    >
      {/* Background Ambient Warm Glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[480px] h-96 sm:h-[480px] rounded-full pointer-events-none blur-3xl opacity-70"
        style={{
          background: `radial-gradient(circle, ${COLORS.bgGlow} 0%, rgba(255, 235, 199, 0.4) 60%, transparent 80%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-6 mx-auto">
        
        {/* ============================================================ */}
        {/* TOP BRAND HEADER: MUNAJ Foods & Logo */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center gap-2 mb-10 sm:mb-12">
          {branding.logo_url && branding.logo_url.trim() ? (
            <img
              src={branding.logo_url.trim()}
              alt={siteName}
              className="h-9 w-auto max-w-[120px] object-contain mb-1"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fallbackEl = document.getElementById('admin-loader-logo-fallback');
                if (fallbackEl) fallbackEl.style.display = 'flex';
              }}
            />
          ) : null}

          <div
            id="admin-loader-logo-fallback"
            className="w-10 h-10 rounded-2xl items-center justify-center text-white font-black text-base shadow-xs"
            style={{
              backgroundColor: COLORS.mainText,
              display: branding.logo_url && branding.logo_url.trim() ? 'none' : 'flex',
            }}
          >
            M
          </div>

          <h1
            className="text-lg sm:text-xl font-extrabold tracking-wide uppercase font-display"
            style={{ color: COLORS.mainText }}
          >
            {siteName}
          </h1>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: '#FFEBC7',
              color: COLORS.softText,
            }}
          >
            Admin Management Portal
          </span>
        </div>

        {/* ============================================================ */}
        {/* CENTRAL FOOD LOADER: ONE FIXED SLOT (88px x 88px, mobile 72px x 72px) */}
        {/* ============================================================ */}
        <div className="relative flex flex-col items-center justify-center mb-8 sm:mb-10">
          
          {/* Subtle Breathing Ring around the food slot */}
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    scale: [0.98, 1.03, 0.98],
                    boxShadow: [
                      `0 0 0 3px ${activeStep.ringColor}35, 0 10px 25px -5px rgba(58, 43, 30, 0.08)`,
                      `0 0 0 3px ${activeStep.ringColor}80, 0 14px 30px -5px rgba(58, 43, 30, 0.12)`,
                      `0 0 0 3px ${activeStep.ringColor}35, 0 10px 25px -5px rgba(58, 43, 30, 0.08)`,
                    ],
                  }
            }
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: EASE_BEZIER,
            }}
            className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl sm:rounded-[22px] flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: COLORS.card,
              border: `3px solid ${activeStep.ringColor}`,
              transition: 'border-color 0.4s ease',
            }}
          >
            {/* ONLY ONE FOOD SVG VISIBLE AT A TIME: occupy the exact same center position */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id + '-' + activeStep.food}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8, scale: 0.84 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, scale: 1.0 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -8, scale: 0.86 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.42,
                  ease: EASE_BEZIER,
                }}
                className="w-full h-full flex items-center justify-center p-2"
              >
                {renderedFoodSvg}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Small 7px Animated Bottom Dot underneath the food slot */}
          <div className="h-5 flex items-center justify-center mt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={'dot-' + activeStep.id}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.4 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [0.4, 1.2, 1.0] }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.6 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.2 : 0.35,
                  ease: EASE_BEZIER,
                }}
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  backgroundColor: activeStep.ringColor,
                  boxShadow: `0 0 8px ${activeStep.ringColor}80`,
                }}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SYNCHRONIZED LOADING MESSAGES */}
        {/* ============================================================ */}
        <div className="h-14 sm:h-16 flex items-center justify-center w-full px-4 mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeStep.id + '-' + activeStep.message}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 8, scale: 0.96 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1.0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6, scale: 0.98 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.2 : 0.38,
                ease: EASE_BEZIER,
              }}
              className="text-base sm:text-lg font-bold font-display tracking-tight text-center select-none"
              style={{ color: COLORS.mainText }}
            >
              {activeStep.message}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ============================================================ */}
        {/* 7 PROGRESS DOTS */}
        {/* ============================================================ */}
        <div className="flex items-center justify-center gap-2.5 py-2">
          {Array.from({ length: 7 }).map((_, index) => {
            const isCompleted = index <= activeStep.progressIndex;
            const isCurrent = index === activeStep.progressIndex;

            return (
              <motion.div
                key={`progress-dot-${index}`}
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: isCurrent ? 1.25 : 1.0,
                      }
                }
                transition={{ duration: 0.3, ease: EASE_BEZIER }}
                className="w-2 h-2 rounded-full transition-colors duration-400"
                style={{
                  backgroundColor: isCompleted ? COLORS.teal : COLORS.line,
                  boxShadow: isCompleted ? `0 0 6px ${COLORS.teal}60` : 'none',
                }}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};
