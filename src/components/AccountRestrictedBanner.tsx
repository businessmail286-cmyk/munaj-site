import React from 'react';
import { ShieldAlert, Headphones, ArrowRight } from 'lucide-react';

interface AccountRestrictedBannerProps {
  onContactSupport: () => void;
  className?: string;
}

export const AccountRestrictedBanner: React.FC<AccountRestrictedBannerProps> = ({
  onContactSupport,
  className = '',
}) => {
  return (
    <div
      id="account-restricted-banner"
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-400">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-amber-950 font-display">
              Account Restricted
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
              Orders Disabled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-xl">
            Your account currently has restricted access. Please contact MUNAJ Customer Support for assistance.
          </p>
        </div>
      </div>

      <button
        type="button"
        id="restricted-contact-support-btn"
        onClick={onContactSupport}
        className="self-start sm:self-auto bg-amber-900 hover:bg-amber-950 text-amber-100 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <Headphones className="w-4 h-4 text-amber-300" />
        <span>Contact Support</span>
        <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
      </button>
    </div>
  );
};
