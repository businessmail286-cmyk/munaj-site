import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../context/BrandingContext';

interface MunajLoadingScreenProps {
  onComplete: () => void;
  mode?: 'login' | 'signup' | 'initial' | null;
}

const EASE_BEZIER = [0.22, 1, 0.36, 1] as const;

// 6 sequential phases for the 2–3 second customer loading experience
const STEPS = [
  { id: 'burger-1', food: 'burger', message: 'Getting things ready…' },
  { id: 'pizza', food: 'pizza', message: 'Checking your account…' },
  { id: 'fries', food: 'fries', message: 'Securing your sign-in…' },
  { id: 'drink', food: 'drink', message: 'Preparing your experience…' },
  { id: 'donut', food: 'donut', message: 'Almost there…' },
  { id: 'burger-2', food: 'burger', message: 'Welcome to MUNAJ' },
];

// Individual step duration in ms (~2.65s total active cycle)
const STEP_DURATIONS = [430, 430, 430, 430, 430, 580];

/* ============================================================ */
/* Crisp Food SVGs (occupying exact same dimensions)            */
/* ============================================================ */

const BurgerSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg viewBox="0 0 64 64" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
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

    {/* Basil Leaf Accents */}
    <ellipse cx="23" cy="34" rx="2" ry="1.2" fill="#33B2A6" transform="rotate(-30 23 34)" />
    <ellipse cx="38" cy="22" rx="1.8" ry="1" fill="#33B2A6" transform="rotate(40 38 22)" />
    <circle cx="34" cy="31" r="1" fill="#3A2B1E" opacity="0.5" />
    <circle cx="26" cy="42" r="0.8" fill="#3A2B1E" opacity="0.5" />
  </svg>
);

const FriesSvg: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg viewBox="0 0 64 64" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <svg viewBox="0 0 64 64" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  </svg>
);

export const MunajLoadingScreen: React.FC<MunajLoadingScreenProps> = ({
  onComplete,
}) => {
  const { branding } = useBranding();
  const siteName = branding.site_name || 'MUNAJ Foods';

  const primaryColor = branding.primary_color || '#16A34A';
  const secondaryColor = branding.secondary_color || '#052E16';
  const accentColor = branding.accent_color || '#B7FF00';
  const textColor = branding.text_color || '#FFFFFF';

  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Lock body scrolling while loading screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Step advancement timer sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (stepIndex < STEPS.length - 1) {
      timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, STEP_DURATIONS[stepIndex]);
    } else {
      // Final message hold, then smooth fade-out and reveal
      timer = setTimeout(() => {
        setIsFadingOut(true);
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 400);
        return () => clearTimeout(exitTimer);
      }, STEP_DURATIONS[stepIndex]);
    }

    return () => clearTimeout(timer);
  }, [stepIndex, onComplete]);

  const currentStep = STEPS[stepIndex];
  const displayMessage =
    stepIndex === STEPS.length - 1
      ? `Welcome to ${siteName.replace(/foods?$/i, '').trim() || 'MUNAJ'}`
      : currentStep.message;

  return (
    <div
      id="munaj-customer-loading-screen"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-6 select-none transition-all duration-400 ease-out ${
        isFadingOut ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#07120B',
        backgroundImage: `radial-gradient(circle at 50% 48%, ${secondaryColor}EE 0%, #08150D 60%, #030704 100%)`,
        color: textColor,
      }}
      role="status"
      aria-label={`Loading ${siteName}`}
    >
      {/* Dynamic Ambient Glow Backdrop */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
        style={{
          backgroundColor: primaryColor,
          opacity: 0.18,
        }}
      />

      {/* Main Column Container:
          MUNAJ Foods
          ↓
          ONE central food SVG
          ↓
          ONE small animated dot
          ↓
          ONE loading message
      */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto px-4">
        
        {/* 1. Brand Title: MUNAJ Foods (or dynamic branding site_name) */}
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_BEZIER }}
          className="text-2xl sm:text-3xl font-black font-display tracking-[0.16em] uppercase mb-8 transition-colors duration-300"
          style={{ color: textColor }}
        >
          {siteName}
        </motion.h1>

        {/* 2. ONE Central Food SVG (Fixed size & position, cycling through Burger -> Pizza -> Fries -> Drink -> Donut -> Burger) */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-6">
          {/* Subtle soft aura behind the food */}
          <div
            className="absolute inset-0 rounded-full blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${accentColor}25 0%, ${primaryColor}15 70%, transparent 100%)`,
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.32, ease: EASE_BEZIER }}
              className="w-full h-full flex items-center justify-center"
            >
              {currentStep.food === 'burger' && <BurgerSvg />}
              {currentStep.food === 'pizza' && <PizzaSvg />}
              {currentStep.food === 'fries' && <FriesSvg />}
              {currentStep.food === 'drink' && <DrinkSvg />}
              {currentStep.food === 'donut' && <DonutSvg />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. ONE Small Animated Dot */}
        <div className="flex items-center justify-center mb-4 h-3">
          <motion.div
            animate={{
              scale: [0.85, 1.35, 0.85],
              opacity: [0.55, 1, 0.55],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: EASE_BEZIER,
            }}
            className="w-2 h-2 rounded-full shadow-sm"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}80`,
            }}
          />
        </div>

        {/* 4. ONE Loading Message (Changing together with the food) */}
        <div className="min-h-[1.75rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: EASE_BEZIER }}
              className="text-xs sm:text-sm font-semibold tracking-wide"
              style={{ color: `${textColor}D9` }}
            >
              {displayMessage}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
