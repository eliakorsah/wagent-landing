'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wagent-cookies-accepted';

export function CookieBanner() {
  const [accepted, setAccepted] = useState<boolean>(true); // hidden until we confirm no stored value

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setAccepted(false); // no decision stored → show banner
    }
  }, []);

  function handleAcceptAll() {
    localStorage.setItem(STORAGE_KEY, 'all');
    setAccepted(true);
  }

  function handleEssentialOnly() {
    localStorage.setItem(STORAGE_KEY, 'essential');
    setAccepted(true);
  }

  if (accepted) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1f2c34] border-t border-[#374045] w-full"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Text block */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#e9edef] leading-relaxed">
              We use cookies to improve your experience and analyse usage. You
              can accept all cookies or only essential ones.
            </p>
            <p className="mt-1 text-xs text-[#8696a0]">
              A service by{' '}
              <span className="font-semibold text-[#00a884]">
                LYTRIX CONSULT
              </span>
              . View our{' '}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-[#00a884] transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:shrink-0">
            <button
              onClick={handleEssentialOnly}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                border border-[#374045] text-[#e9edef]
                hover:border-[#8696a0] hover:text-white
                transition-all whitespace-nowrap
              "
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                bg-[#00a884] text-white
                hover:bg-[#00d4a7]
                transition-all whitespace-nowrap
              "
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
