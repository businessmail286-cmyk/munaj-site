import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  Home,
  XCircle,
} from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderProgressProps {
  status: OrderStatus | string;
}

const STEPS: { keys: string[]; label: string; icon: React.FC<{ className?: string }> }[] = [
  { keys: ['pending', 'order received'], label: 'Order Received', icon: Clock },
  { keys: ['confirmed', 'accepted'], label: 'Accepted', icon: CheckCircle2 },
  { keys: ['preparing', 'cooking'], label: 'Cooking in Pot', icon: ChefHat },
  { keys: ['ready', 'packed'], label: 'Packed & Ready', icon: PackageCheck },
  { keys: ['picked_up', 'on_the_way', 'out for delivery', 'out_for_delivery'], label: 'On the Way', icon: Bike },
  { keys: ['delivered', 'completed'], label: 'Delivered', icon: Home },
];

export const OrderProgress: React.FC<OrderProgressProps> = ({ status }) => {
  const normStatus = (status || 'pending').toLowerCase().replace(/_/g, ' ');

  if (normStatus === 'cancelled' || normStatus === 'canceled') {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            This order was cancelled. If you need any clarification, please contact customer support.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.keys.includes(normStatus) || s.keys.includes((status || '').toLowerCase()));
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="py-4">
      {/* Stepper bar desktop */}
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-neutral-200 z-0">
          <div
            className="h-full bg-amber-500 transition-all duration-500 rounded-full"
            style={{
              width: `${(activeIdx / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-0 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isUpcoming = idx > activeIdx;
            const StepIcon = step.icon;

            return (
              <div
                key={step.label}
                className="flex flex-col items-center text-center p-2 rounded-xl sm:p-0 bg-neutral-50/50 sm:bg-transparent"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : isCurrent
                      ? 'bg-neutral-900 text-amber-400 ring-4 ring-amber-500/30 scale-110 shadow-lg'
                      : 'bg-neutral-200 text-neutral-400'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-2 text-xs font-bold ${
                    isCurrent
                      ? 'text-neutral-900 font-extrabold'
                      : isCompleted
                      ? 'text-amber-700'
                      : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5 sm:block hidden">
                  {isCurrent ? 'Current' : isCompleted ? 'Done' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
