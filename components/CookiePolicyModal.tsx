import React, { useEffect } from 'react';

interface CookiePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#231B15]/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-policy-title"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#231B15]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#DFD6C7] bg-[#F4EFE6] flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A94424] font-semibold">
              Transparency &amp; Storage
            </div>
            <h2 id="cookie-policy-title" className="font-serif font-bold text-xl sm:text-2xl text-[#231B15]">
              Cookie &amp; Local Storage Policy
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cookie Policy"
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#6E6256] hover:text-[#231B15] hover:bg-[#ECE5D8] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-[#3B3027]">
          <p className="font-serif text-base text-[#231B15]">
            Event Horizon uses strictly functional cookies and browser storage to deliver offline-first
            reading, preference weighting, and optional cross-device synchronization. We do not use
            third-party advertising or behavioral tracking cookies.
          </p>

          <div className="space-y-4">
            <section className="p-4 rounded-xl bg-[#F4EFE6] border border-[#DFD6C7]">
              <h3 className="font-serif font-bold text-base text-[#231B15]">
                1. Essential Authentication Cookies (Firebase Auth)
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5146] mt-1">
                When you choose to sign in with Google, Firebase Authentication stores essential session
                tokens in your browser to verify your identity and enforce Firestore ownership rules.
              </p>
            </section>

            <section className="p-4 rounded-xl bg-[#F4EFE6] border border-[#DFD6C7]">
              <h3 className="font-serif font-bold text-base text-[#231B15]">
                2. Offline Brief Cache (IndexedDB / Firestore Local Persistence)
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5146] mt-1">
                Bookmarked dispatches in <strong>The Archives</strong> are persisted locally across tabs
                using Firestore&apos;s multi-tab IndexedDB cache so saved articles remain readable without
                an internet connection.
              </p>
            </section>

            <section className="p-4 rounded-xl bg-[#F4EFE6] border border-[#DFD6C7]">
              <h3 className="font-serif font-bold text-base text-[#231B15]">
                3. Reading Affinity &amp; Consent Preferences (localStorage)
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5146] mt-1">
                Keys <code className="font-mono text-xs bg-[#FAF7F1] px-1.5 py-0.5 rounded border border-[#DFD6C7]">eh_user_prefs</code>{' '}
                and <code className="font-mono text-xs bg-[#FAF7F1] px-1.5 py-0.5 rounded border border-[#DFD6C7]">eh_cookie_consent</code>{' '}
                store your domain reading weights and acknowledgement of this policy locally on your device.
              </p>
            </section>

            <section className="p-4 rounded-xl bg-[#F4EFE6] border border-[#DFD6C7]">
              <h3 className="font-serif font-bold text-base text-[#231B15]">
                4. Location &amp; External Media Proxying
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5146] mt-1">
                If you grant browser geolocation permission, coordinates are used only to resolve your
                country via OpenStreetMap Nominatim for national news scoping. Article imagery is fetched
                through our server proxy solely to apply local vintage print styling in your browser.
              </p>
            </section>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#DFD6C7] bg-[#F4EFE6] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6256]">
            Effective November 2026
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DFD6C7] bg-[#FAF7F1] text-xs font-semibold text-[#231B15] hover:border-[#A94424] min-h-[40px]"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-[#A94424] hover:bg-[#8B3218] text-xs font-semibold text-[#FAF7F1] min-h-[40px]"
              >
                Acknowledge &amp; Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
