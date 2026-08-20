import React, { useState } from 'react';

interface WhatsAppButtonProps {
  hasFloatingCart?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ hasFloatingCart = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const phoneNumber = '2348064544421';
  const message = 'Hello MUNAJ Foods, I need help with my order.';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        hasFloatingCart
          ? 'bottom-22 right-5 sm:bottom-24 sm:right-6'
          : 'bottom-5 right-5 sm:bottom-6 sm:right-6'
      }`}
    >
      <div className="relative flex items-center justify-end">
        {/* Desktop Tooltip */}
        <div
          role="tooltip"
          className={`hidden md:block absolute right-full mr-3.5 px-3 py-1.5 rounded-xl bg-[#052E16] text-[#B7FF00] text-xs font-bold whitespace-nowrap shadow-xl border border-[#16A34A]/40 transition-all duration-200 pointer-events-none ${
            isHovered
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-2 pointer-events-none'
          }`}
        >
          Chat with us on WhatsApp
          {/* Tooltip arrow */}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#052E16] border-t border-r border-[#16A34A]/40 rotate-45" />
        </div>

        {/* WhatsApp Click-to-Chat Action Button */}
        <a
          id="whatsapp-chat-button"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-900/35 border-2 border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 select-none"
        >
          {/* Official WhatsApp SVG Icon */}
          <svg
            className="w-6 h-6 fill-current text-white shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.05 20.21c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.18-.48-.3z" />
          </svg>

          {/* Optional Chat Label on Larger Screens */}
          <span className="hidden sm:inline-block text-xs font-extrabold text-white tracking-wide whitespace-nowrap">
            Chat with us
          </span>
        </a>
      </div>
    </div>
  );
};
