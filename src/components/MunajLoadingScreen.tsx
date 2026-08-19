import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  PackageCheck,
  Bike,
  Heart,
  Home,
  Sparkles,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MunajLoadingScreenProps {
  onComplete: () => void;
  mode?: 'login' | 'signup' | null;
}

interface StepData {
  timeStart: number;
  timeEnd: number;
  message: string;
  subtext: string;
  iconName: 'food' | 'delicious' | 'favorites' | 'menu' | 'experience' | 'ready' | 'delivered' | 'eat';
}

const STEPS: StepData[] = [
  {
    timeStart: 0,
    timeEnd: 2,
    message: 'Welcome to MUNAJ',
    subtext: 'Authentic Nigerian delicacies crafted with passion',
    iconName: 'food',
  },
  {
    timeStart: 2,
    timeEnd: 4,
    message: 'Preparing something delicious...',
    subtext: 'Fresh ingredients, rich aromas & spicy perfection',
    iconName: 'delicious',
  },
  {
    timeStart: 4,
    timeEnd: 6,
    message: 'Finding your favorites...',
    subtext: 'Smoky Jollof, spicy Suya, Pepper Soup & more',
    iconName: 'favorites',
  },
  {
    timeStart: 6,
    timeEnd: 8,
    message: "Loading today's menu...",
    subtext: 'Freshly prepared dishes directly from our kitchen',
    iconName: 'menu',
  },
  {
    timeStart: 8,
    timeEnd: 10,
    message: 'Preparing your food experience...',
    subtext: 'Tailoring your order preferences & specials',
    iconName: 'experience',
  },
  {
    timeStart: 10,
    timeEnd: 12,
    message: 'Almost ready...',
    subtext: 'Quick dispatch and seamless doorstep delivery',
    iconName: 'ready',
  },
  {
    timeStart: 12,
    timeEnd: 14,
    message: 'Your MUNAJ experience is ready',
    subtext: 'Your culinary journey is about to begin',
    iconName: 'delivered',
  },
  {
    timeStart: 14,
    timeEnd: 15,
    message: "Let's eat!",
    subtext: 'Good food. Right to your door.',
    iconName: 'eat',
  },
];

export const MunajLoadingScreen: React.FC<MunajLoadingScreenProps> = ({
  onComplete,
  mode,
}) => {
  const TOTAL_DURATION_MS = 15000;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Lock body scrolling while loading screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Timer loop for 15 seconds
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const currentElapsed = now - startTime;

      if (currentElapsed >= TOTAL_DURATION_MS) {
        setElapsedMs(TOTAL_DURATION_MS);
        clearInterval(interval);
        // Start fade-out
        setIsFadingOut(true);
        // After 700ms fade transition, call onComplete
        const completeTimeout = setTimeout(() => {
          onComplete();
        }, 700);
        return () => clearTimeout(completeTimeout);
      } else {
        setElapsedMs(currentElapsed);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Current seconds elapsed (0.0 to 15.0)
  const secondsElapsed = elapsedMs / 1000;
  const progressPercent = Math.min(100, (elapsedMs / TOTAL_DURATION_MS) * 100);

  // Determine current active step
  const currentStepIndex = useMemo(() => {
    for (let i = 0; i < STEPS.length; i++) {
      if (secondsElapsed >= STEPS[i].timeStart && secondsElapsed < STEPS[i].timeEnd) {
        return i;
      }
    }
    return STEPS.length - 1;
  }, [secondsElapsed]);

  const currentStep = STEPS[currentStepIndex];

  // Render Icon according to active step
  const renderStepIcon = (iconName: StepData['iconName']) => {
    switch (iconName) {
      case 'food':
        return <UtensilsCrossed className="w-12 h-12 text-[#B7FF00]" />;
      case 'delicious':
        return <Flame className="w-12 h-12 text-[#B7FF00] animate-pulse" />;
      case 'favorites':
        return <Heart className="w-12 h-12 text-[#B7FF00]" />;
      case 'menu':
        return <ShoppingCart className="w-12 h-12 text-[#B7FF00]" />;
      case 'experience':
        return <PackageCheck className="w-12 h-12 text-[#B7FF00]" />;
      case 'ready':
        return <Bike className="w-12 h-12 text-[#B7FF00]" />;
      case 'delivered':
        return <Home className="w-12 h-12 text-[#B7FF00]" />;
      case 'eat':
        return <Sparkles className="w-14 h-14 text-[#B7FF00]" />;
      default:
        return <UtensilsCrossed className="w-12 h-12 text-[#B7FF00]" />;
    }
  };

  return (
    <div
      id="munaj-loading-screen"
      className={`fixed inset-0 z-[99999] bg-[#071A0E] text-white flex flex-col items-center justify-between p-6 sm:p-10 select-none transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 35%, rgba(22, 163, 74, 0.22) 0%, rgba(5, 46, 22, 0.6) 45%, #071A0E 90%)`,
      }}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#16A34A]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#B7FF00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="relative z-10 text-center pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#052E16] border border-[#16A34A]/40 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#B7FF00] animate-ping" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#B7FF00]">
            {mode === 'signup' ? 'New Customer Welcome' : 'Customer Fast Login'}
          </span>
        </div>
      </div>

      {/* Center Hero & Animation Sequence */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-8 my-auto">
        {/* Animated Brand Logo */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center justify-center">
            <h1 className="text-4xl sm:text-5xl font-black font-display tracking-wider text-white">
              MUN<span className="text-[#B7FF00]">AJ</span>
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-emerald-300">
            GOOD FOOD. RIGHT TO YOUR DOOR.
          </p>
        </div>

        {/* Central Glowing Icon Vessel with Morphing Transitions */}
        <div className="relative flex items-center justify-center">
          {/* Outer glowing pulsing ring */}
          <div className="absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-[#16A34A]/40 bg-[#052E16]/80 shadow-[0_0_50px_rgba(22,163,74,0.35)] animate-pulse" />
          <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[#B7FF00]/30 shadow-[0_0_30px_rgba(183,255,0,0.25)]" />

          {/* Icon Stage */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#0B3D20] to-[#052E16] border-2 border-[#B7FF00]/50 flex items-center justify-center shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.iconName}
                initial={{ opacity: 0, scale: 0.75, y: 8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -4, 0],
                  transition: {
                    opacity: { duration: 0.35 },
                    scale: { duration: 0.4, type: 'spring', damping: 15 },
                    y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                  },
                }}
                exit={{ opacity: 0, scale: 1.15, y: -8, transition: { duration: 0.25 } }}
                className="flex items-center justify-center drop-shadow-[0_0_15px_rgba(183,255,0,0.5)]"
              >
                {renderStepIcon(currentStep.iconName)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Animated Message Sequence */}
        <div className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1.5 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                {currentStep.message}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium mt-1">
                {currentStep.subtext}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic Multi-segment Progress Bar */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-400">
            <span>PREPARING EXPERIENCE</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#052E16] rounded-full overflow-hidden border border-[#16A34A]/40 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] via-[#B7FF00] to-[#16A34A] rounded-full transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(183,255,0,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between pt-1 px-1">
            {STEPS.map((step, idx) => {
              const isPast = secondsElapsed >= step.timeEnd;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#B7FF00] scale-150 shadow-[0_0_8px_#B7FF00]'
                      : isPast
                      ? 'bg-[#16A34A]'
                      : 'bg-neutral-800'
                  }`}
                  title={step.message}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-center pb-4 text-xs text-neutral-400">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>Steaming hot Nigerian favorites arriving fresh & on time</span>
        </p>
      </div>
    </div>
  );
};
