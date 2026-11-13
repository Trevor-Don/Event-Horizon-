import React from 'react';

interface EditorialFooterProps {
  onNavigate: (tab: 'Home' | 'Events' | 'Graph' | 'Audio' | 'Saved' | 'Settings') => void;
  onOpenCookiePolicy: () => void;
}

export const EditorialFooter: React.FC<EditorialFooterProps> = ({
  onNavigate,
  onOpenCookiePolicy,
}) => {
  return (
    <footer className="mt-14 border-t border-[#DFD6C7] bg-[#EFE9DD]/75 text-[#231B15]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#DFD6C7]">
          {/* Masthead & Colophon */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A94424] font-semibold">
              Daily Intelligence Dispatch
            </div>
            <div className="font-serif font-bold text-2xl tracking-tight text-[#231B15]">
              Event Horizon
            </div>
            <p className="text-xs sm:text-sm text-[#5C5146] leading-relaxed max-w-md">
              A structured knowledge news reader optimizing for relevance per unit time through live
              wire curation, entity cartography, neural audio briefings, and offline archives.
            </p>
          </div>

          {/* Editions */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#6E6256] font-semibold">
              Sections
            </div>
            <nav aria-label="Footer Sections" className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium text-[#3B3027]">
              <button type="button" onClick={() => onNavigate('Home')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                Front Page
              </button>
              <button type="button" onClick={() => onNavigate('Events')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                World Wire
              </button>
              <button type="button" onClick={() => onNavigate('Graph')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                Knowledge Graph
              </button>
              <button type="button" onClick={() => onNavigate('Audio')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                Eve AI Briefing
              </button>
              <button type="button" onClick={() => onNavigate('Saved')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                The Archives
              </button>
              <button type="button" onClick={() => onNavigate('Settings')} className="text-left hover:text-[#A94424] transition-colors py-0.5">
                Desk &amp; Account
              </button>
            </nav>
          </div>

          {/* Governance & Policies */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#6E6256] font-semibold">
              Policies &amp; Storage
            </div>
            <div className="flex flex-col items-start gap-2 text-xs font-medium text-[#3B3027]">
              <button
                type="button"
                onClick={onOpenCookiePolicy}
                className="hover:text-[#A94424] underline decoration-[#DFD6C7] underline-offset-4 transition-colors py-0.5"
              >
                Cookie &amp; Local Storage Policy
              </button>
              <button
                type="button"
                onClick={onOpenCookiePolicy}
                className="hover:text-[#A94424] transition-colors py-0.5 text-left text-[#5C5146]"
              >
                Offline Cache &amp; Auth Notice
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Citation Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-wider text-[#6E6256]">
          <div>© {new Date().getFullYear()} Event Horizon · All Dispatches Reserved</div>
          <div className="text-[#231B15] font-semibold tracking-[0.12em]">
            Created by <span className="text-[#A94424]">Trevon Creates</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
