import React, { useState, useEffect, useCallback } from 'react';
import { fetchNewsProjection, generateBriefingAudio } from './services/geminiService';
import { NewsEvent, ProjectionSettings } from './types';
import { EventCard } from './components/EventCard';
import { EventListRow } from './components/EventListRow';
import { AudioPlayer } from './components/AudioPlayer';
import { IconSearch, IconBookmark, IconWorld, IconMic } from './components/Icons';
import { ArticleReader } from './components/ArticleReader';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { SavedEventsList } from './components/SavedEventsList';
import { EditorialFooter } from './components/EditorialFooter';
import { CookiePolicyModal } from './components/CookiePolicyModal';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { getEditionDateLabel } from './utils/editorialMedia';

const DOMAINS = ['General', 'Technology', 'Geopolitics', 'Economy', 'Science', 'Culture', 'Environment'];
const COUNTRIES = [
  'Global',
  'United States',
  'United Kingdom',
  'China',
  'Russia',
  'India',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'South Africa',
];

const FrontPageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

const GraphIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const AccountIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'}
    />
  </svg>
);

type NavTab = 'Home' | 'Events' | 'Graph' | 'Audio' | 'Saved' | 'Settings';

const App: React.FC = () => {
  const [navTab, setNavTab] = useState<NavTab>('Home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);

  const [settings, setSettings] = useState<ProjectionSettings>({
    scope: 'World',
    country: '',
    domain: 'General',
    timeBudget: 5,
    rssUrl: '',
  });

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioMinutes, setAudioMinutes] = useState(3);
  const [readingEvent, setReadingEvent] = useState<NewsEvent | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [cookiePolicyOpen, setCookiePolicyOpen] = useState(false);
  const [cookieConsentAccepted, setCookieConsentAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eh_cookie_consent') === 'accepted';
    } catch {
      return false;
    }
  });

  const editionDate = getEditionDateLabel();

  const acceptCookieConsent = () => {
    try {
      localStorage.setItem('eh_cookie_consent', 'accepted');
    } catch {}
    setCookieConsentAccepted(true);
  };

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setEvents([]);
    const data = await fetchNewsProjection(settings);
    setEvents(data);
    setIsLoading(false);
  }, [settings]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const prefDoc = await getDoc(doc(db, 'users', u.uid));
          if (prefDoc.exists() && prefDoc.data().preferences) {
            setSettings((s) => ({ ...s, userPreferences: prefDoc.data().preferences }));
          } else {
            await setDoc(doc(db, 'users', u.uid), { preferences: {} }, { merge: true });
          }
          const savedDocs = await getDocs(collection(db, `users/${u.uid}/savedEvents`));
          const evs = savedDocs.docs.map((d) => d.data() as NewsEvent);
          setSavedEvents(evs);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setSavedEvents([]);
        const localPrefs = localStorage.getItem('eh_user_prefs');
        if (localPrefs) {
          try {
            setSettings((s) => ({ ...s, userPreferences: JSON.parse(localPrefs) }));
          } catch {}
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setGeoLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationPermissionGranted(true);
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await res.json();
            if (data.address && data.address.country) {
              setSettings((s) => ({ ...s, country: data.address.country, scope: 'National' }));
            } else {
              setSettings((s) => ({ ...s, scope: 'World' }));
            }
          } catch (e) {
            console.error(e);
            setSettings((s) => ({ ...s, scope: 'World' }));
          }
          setGeoLocating(false);
        },
        () => {
          setLocationPermissionGranted(false);
          setSettings((s) => ({ ...s, scope: 'World' }));
          setGeoLocating(false);
        }
      );
    } else {
      setGeoLocating(false);
      setSettings((s) => ({ ...s, scope: 'World' }));
    }
  }, []);

  useEffect(() => {
    if (!geoLocating) {
      loadEvents();
    }
  }, [geoLocating, loadEvents]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in failed', err);
      setAuthError('Google sign-in could not be completed. Please allow popups and try again.');
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const toggleSaveEvent = async (event: NewsEvent) => {
    const isSaved = savedEvents.some((e) => e.id === event.id);

    setSavedEvents((prev) => {
      if (isSaved) return prev.filter((e) => e.id !== event.id);
      return [...prev, event];
    });

    if (auth.currentUser) {
      try {
        if (isSaved) {
          await deleteDoc(doc(db, `users/${auth.currentUser.uid}/savedEvents`, event.id));
        } else {
          await setDoc(doc(db, `users/${auth.currentUser.uid}/savedEvents`, event.id), event);
        }
      } catch (err) {
        console.error('Save event failed', err);
        try {
          handleFirestoreError(
            err,
            isSaved ? OperationType.DELETE : OperationType.CREATE,
            `users/${auth.currentUser.uid}/savedEvents`
          );
        } catch {}
      }
    }
  };

  const handleReadTime = useCallback((eventId: string, category: string, timeMs: number) => {
    if (timeMs > 5000) {
      setSettings((prev) => {
        const currentPrefs = prev.userPreferences || {};
        const currentWeight = currentPrefs[category] || 1.0;
        const increase = Math.min(0.5, (timeMs / 30000) * 0.1);
        const newPrefs = { ...currentPrefs, [category]: Math.min(5.0, currentWeight + increase) };

        localStorage.setItem('eh_user_prefs', JSON.stringify(newPrefs));
        if (auth.currentUser) {
          setDoc(doc(db, `users/${auth.currentUser.uid}`), { preferences: newPrefs }, { merge: true }).catch((e) =>
            console.error(e)
          );
        }
        return { ...prev, userPreferences: newPrefs };
      });
    }
  }, []);

  const handleGenerateAudio = async (opts: {
    country: string;
    domain: string;
    voice: string;
    minutes: number;
  }) => {
    setIsAudioLoading(true);
    const url = await generateBriefingAudio(events, opts.minutes, opts.voice);
    if (url) {
      setAudioSrc(url);
      setNavTab('Audio');
    }
    setIsAudioLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSettings((s) => ({ ...s, searchQuery: searchQuery.trim(), domain: 'General' }));
      setNavTab('Home');
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSettings((s) => ({ ...s, searchQuery: '' }));
  };

  const sectionTabs = [
    { id: 'front', label: 'Front Page' },
    { id: 'local', label: 'Local' },
    { id: 'global', label: 'Global' },
    { id: 'Technology', label: 'Technology' },
    { id: 'Geopolitics', label: 'Geopolitics' },
    { id: 'Economy', label: 'Economy' },
    { id: 'Science', label: 'Science' },
    { id: 'Culture', label: 'Culture' },
  ];

  const isSectionActive = (id: string) => {
    if (id === 'front') return settings.domain === 'General' && settings.scope === 'World' && !settings.searchQuery;
    if (id === 'local') return settings.scope === 'National';
    if (id === 'global') return settings.scope === 'World' && settings.domain === 'Geopolitics';
    return settings.domain === id;
  };

  const handleSectionSelect = (id: string) => {
    if (id === 'front') {
      setSettings((s) => ({ ...s, scope: 'World', domain: 'General', searchQuery: '' }));
    } else if (id === 'local') {
      setSettings((s) => ({ ...s, scope: 'National', searchQuery: '' }));
    } else if (id === 'global') {
      setSettings((s) => ({ ...s, scope: 'World', domain: 'Geopolitics', searchQuery: '' }));
    } else {
      setSettings((s) => ({ ...s, domain: id, searchQuery: '' }));
    }
    if (navTab !== 'Home' && navTab !== 'Events') {
      setNavTab('Home');
    }
  };

  const renderSectionStrip = () => (
    <div className="bg-[#FAF7F1] border-b border-[#DFD6C7] px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto hide-scrollbar">
        {sectionTabs.map((tab) => {
          const active = isSectionActive(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSectionSelect(tab.id)}
              className={`py-3 text-[11px] sm:text-xs font-mono uppercase tracking-[0.14em] transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                active
                  ? 'border-[#A94424] text-[#A94424] font-semibold'
                  : 'border-transparent text-[#6E6256] hover:text-[#231B15]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Desktop-only collapsible sidebar (lg+)
  const renderDesktopSidebar = () => {
    const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
      { id: 'Home', label: 'Front Page', icon: <FrontPageIcon /> },
      { id: 'Events', label: 'World Wire', icon: <IconWorld className="w-5 h-5" /> },
      { id: 'Graph', label: 'Knowledge Graph', icon: <GraphIcon /> },
      { id: 'Audio', label: 'Eve AI Briefing', icon: <IconMic className="w-5 h-5" /> },
      { id: 'Saved', label: 'The Archives', icon: <IconBookmark className="w-5 h-5" /> },
      { id: 'Settings', label: 'Desk & Account', icon: <AccountIcon /> },
    ];

    return (
      <aside
        className={`hidden lg:flex ${
          sidebarCollapsed ? 'w-20 px-3' : 'w-64 px-4'
        } bg-[#EFE9DD] border-r border-[#DFD6C7] flex-col justify-between py-6 shrink-0 transition-all duration-200`}
      >
        <div>
          <div className="pb-5 mb-5 border-b border-[#DFD6C7] flex items-start justify-between gap-2">
            {!sidebarCollapsed ? (
              <div className="px-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6E6256]">
                  Daily Dispatch
                </div>
                <div className="font-serif font-bold text-2xl tracking-tight text-[#231B15] mt-0.5 truncate">
                  Event Horizon
                </div>
                <div className="text-[10px] font-mono text-[#6E6256] mt-1 tabular-nums">{editionDate}</div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <span className="font-serif font-bold text-xl text-[#231B15]">EH</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="min-w-[32px] min-h-[32px] rounded-lg border border-[#DFD6C7] bg-[#FAF7F1] text-[#6E6256] hover:text-[#231B15] hover:border-[#A94424] flex items-center justify-center shrink-0 transition-colors"
            >
              <CollapseIcon collapsed={sidebarCollapsed} />
            </button>
          </div>

          <nav className="flex flex-col space-y-1.5" aria-label="Desktop Navigation">
            {navItems.map((item) => {
              const active = navTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNavTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } py-2.5 rounded-xl text-sm transition-colors min-h-[44px] text-left whitespace-nowrap ${
                    active
                      ? 'bg-[#FAF7F1] text-[#A94424] border border-[#DFD6C7] font-semibold shadow-[0_1px_4px_rgba(35,27,21,0.04)]'
                      : 'text-[#5C5146] hover:bg-[#FAF7F1]/60 hover:text-[#231B15]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.id === 'Saved' && savedEvents.length > 0 && (
                    <span className="ml-auto text-[11px] font-mono text-[#6E6256] tabular-nums">
                      {savedEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Footer in Desktop Sidebar */}
        <div className="pt-4 border-t border-[#DFD6C7]">
          {user ? (
            <div
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'
              } rounded-xl bg-[#FAF7F1] border border-[#DFD6C7]`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Reader avatar'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full border border-[#DFD6C7] shrink-0 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#A94424] text-[#FAF7F1] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                  {(user.displayName || user.email || 'R').charAt(0).toUpperCase()}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#231B15] truncate">
                    {user.displayName || 'Subscriber'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-[11px] font-mono text-[#A94424] hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              title={sidebarCollapsed ? 'Sign In with Google' : undefined}
              className="w-full py-2.5 px-3 rounded-xl bg-[#231B15] hover:bg-[#3A2E25] text-[#FAF7F1] text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center"
            >
              {sidebarCollapsed ? <AccountIcon /> : 'Sign In with Google'}
            </button>
          )}
        </div>
      </aside>
    );
  };

  // Responsive Top Header:
  // - Mobile (< md): Clean single masthead + Search (NO hamburger, NO duplicate Account icon!)
  // - Tablet (md to < lg): Full 3-zone top navbar replacing the sidebar
  // - Desktop (lg+): Scope indicator + Search + Knowledge Graph shortcut
  const renderTopMasthead = () => {
    const tabletLinks: { id: NavTab; label: string }[] = [
      { id: 'Home', label: 'Front Page' },
      { id: 'Events', label: 'World Wire' },
      { id: 'Graph', label: 'Graph' },
      { id: 'Audio', label: 'Eve AI' },
      { id: 'Saved', label: 'Archives' },
      { id: 'Settings', label: 'Account' },
    ];

    return (
      <header className="h-14 md:h-16 px-4 sm:px-6 lg:px-10 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#DFD6C7] sticky top-0 z-20 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand / Scope */}
        <div className="flex items-center shrink-0">
          {/* Tablet Brand Title */}
          <button
            type="button"
            onClick={() => setNavTab('Home')}
            className="hidden md:block lg:hidden font-serif font-bold text-lg tracking-tight text-[#231B15] whitespace-nowrap"
          >
            Event Horizon
          </button>

          {/* Desktop Scope Indicator */}
          <div className="hidden lg:block text-[11px] font-mono uppercase tracking-[0.16em] text-[#6E6256] whitespace-nowrap">
            {settings.searchQuery
              ? `Search · "${settings.searchQuery}"`
              : `${settings.scope === 'National' && settings.country ? settings.country : 'Global Edition'} · ${
                  settings.domain
                }`}
          </div>

          {/* Mobile Compact Masthead (left-aligned when searching hidden, or always clean) */}
          {!isSearching && (
            <div className="md:hidden flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#6E6256] tabular-nums leading-none">
                {editionDate}
              </span>
              <h1 className="font-serif font-bold text-lg tracking-tight text-[#231B15] leading-tight">
                EVENT HORIZON
              </h1>
            </div>
          )}
        </div>

        {/* Zone 2: Tablet Top Navbar Links OR Search Input */}
        {isSearching ? (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Search dispatches, regions, topics..."
              className="w-full bg-[#FAF7F1] border border-[#DFD6C7] rounded-full px-4 py-2 text-sm text-[#231B15] placeholder-[#9B8E80] focus:outline-none focus:border-[#A94424] min-h-[40px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E6256] hover:text-[#231B15]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        ) : (
          <>
            {/* Tablet Single-Line Navbar (md to < lg) */}
            <nav aria-label="Tablet Navigation" className="hidden md:flex lg:hidden items-center gap-5 overflow-x-auto hide-scrollbar">
              {tabletLinks.map((link) => {
                const active = navTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => setNavTab(link.id)}
                    className={`py-1 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                      active
                        ? 'border-[#A94424] text-[#A94424] font-semibold'
                        : 'border-transparent text-[#5C5146] hover:text-[#231B15]'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Center Descriptor */}
            <div className="hidden lg:flex items-center gap-2 font-serif italic text-sm text-[#6E6256]">
              <span>Relevance per unit time</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setNavTab('Graph')}
                className="text-[#A94424] hover:underline not-italic font-sans text-xs font-semibold"
              >
                Open Knowledge Graph
              </button>
            </div>
          </>
        )}

        {/* Zone 3: Single Search Action (no duplicate Account icon on mobile/desktop!) */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSearching && (
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              aria-label="Search dispatches"
              className="min-w-[44px] min-h-[44px] -mr-1 flex items-center justify-center text-[#231B15] hover:text-[#A94424] transition-colors"
            >
              <IconSearch className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
    );
  };

  // Mobile-only bottom tab bar (< md). Account lives exclusively here on mobile.
  const renderMobileBottomNav = () => {
    const items: { id: NavTab; label: string; icon: React.ReactNode }[] = [
      { id: 'Home', label: 'Front', icon: <FrontPageIcon /> },
      { id: 'Events', label: 'World', icon: <IconWorld className="w-5 h-5" /> },
      { id: 'Audio', label: 'Eve AI', icon: <IconMic className="w-5 h-5" /> },
      { id: 'Saved', label: 'Saved', icon: <IconBookmark className="w-5 h-5" /> },
      { id: 'Settings', label: 'Account', icon: <AccountIcon /> },
    ];

    return (
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F1]/95 backdrop-blur-md border-t border-[#DFD6C7] grid grid-cols-5 items-center h-16 pb-safe z-30"
      >
        {items.map((item) => {
          const active = navTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setNavTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                active ? 'text-[#A94424]' : 'text-[#6E6256] hover:text-[#231B15]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-mono uppercase tracking-wider mt-1 font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  };

  const renderHome = () => {
    const leadEvent = events[0];
    const secondaryEvents = events.slice(1, 5);
    const wireEvents = events.slice(5, 11);

    return (
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {renderSectionStrip()}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8">
          {authError && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-[#FAF7F1] border border-[#A94424]/40 text-xs text-[#8B3218] flex items-center justify-between gap-4">
              <span>{authError}</span>
              <button type="button" onClick={() => setAuthError(null)} className="font-semibold underline">
                Dismiss
              </button>
            </div>
          )}

          {geoLocating ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-[#DFD6C7] border-t-[#A94424] rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-[#6E6256]">
                Calibrating Local Edition...
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="h-[380px] bg-[#E7DFD1] rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-56 bg-[#E7DFD1] rounded-2xl animate-pulse" />
                  <div className="h-56 bg-[#E7DFD1] rounded-2xl animate-pulse" />
                </div>
              </div>
              <div className="lg:col-span-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-[#E7DFD1] rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-8 max-w-lg mx-auto">
              <h3 className="font-serif font-bold text-xl text-[#231B15]">No dispatches found</h3>
              <p className="text-sm text-[#6E6256] mt-2">
                No stories matched your current scope or search filter. Reset filters to restore the Front Page.
              </p>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, scope: 'World', domain: 'General', searchQuery: '', rssUrl: '' }))
                }
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#A94424] text-[#FAF7F1] text-sm font-semibold min-h-[44px]"
              >
                Restore Global Front Page
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Broadsheet Column */}
              <div className="lg:col-span-8 space-y-8">
                {leadEvent && (
                  <EventCard
                    event={leadEvent}
                    size="large"
                    index={0}
                    onClick={() => setReadingEvent(leadEvent)}
                    isSaved={savedEvents.some((e) => e.id === leadEvent.id)}
                    onSave={(e) => {
                      e.stopPropagation();
                      toggleSaveEvent(leadEvent);
                    }}
                  />
                )}

                {secondaryEvents.length > 0 && (
                  <section aria-label="Featured Dispatches">
                    <div className="flex items-center justify-between border-b border-[#DFD6C7] pb-2.5 mb-5">
                      <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#6E6256] font-semibold">
                        In Other Columns
                      </h3>
                      <button
                        type="button"
                        onClick={() => setNavTab('Events')}
                        className="text-xs font-semibold text-[#A94424] hover:underline"
                      >
                        All Dispatches →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
                      {secondaryEvents.map((event, idx) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          size="medium"
                          index={idx + 1}
                          onClick={() => setReadingEvent(event)}
                          isSaved={savedEvents.some((e) => e.id === event.id)}
                          onSave={(e) => {
                            e.stopPropagation();
                            toggleSaveEvent(event);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Broadsheet Wire Column */}
              <aside className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#DFD6C7] pb-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#6E6256] font-semibold">
                    High-Impact Wire
                  </h3>
                  <span className="text-[10px] font-mono text-[#6E6256] tabular-nums">
                    {events.length} Stories
                  </span>
                </div>

                <div className="space-y-3">
                  {(wireEvents.length > 0 ? wireEvents : events.slice(1)).map((event, idx) => (
                    <EventListRow
                      key={event.id}
                      event={event}
                      index={wireEvents.length > 0 ? idx + 5 : idx + 1}
                      isSelected={false}
                      onClick={() => setReadingEvent(event)}
                      onOpenArticle={() => setReadingEvent(event)}
                      isSaved={savedEvents.some((e) => e.id === event.id)}
                      onSave={(e) => {
                        e.stopPropagation();
                        toggleSaveEvent(event);
                      }}
                    />
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNavTab('Audio')}
                    className="w-full py-3 px-4 rounded-xl bg-[#FAF7F1] border border-[#DFD6C7] hover:border-[#A94424] text-xs font-semibold text-[#231B15] flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                  >
                    <IconMic className="w-4 h-4 text-[#A94424]" />
                    <span>Listen to Eve AI Briefing</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavTab('Graph')}
                    className="w-full py-3 px-4 rounded-xl bg-[#FAF7F1] border border-[#DFD6C7] hover:border-[#A94424] text-xs font-semibold text-[#231B15] flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                  >
                    <GraphIcon />
                    <span>Explore Entity Knowledge Graph</span>
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>

        <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <div className="border-b border-[#DFD6C7] pb-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6E6256] mb-1">
            Reader Profile &amp; Edition Preferences
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#231B15]">Desk &amp; Account</h2>
        </div>

        {/* Account Card */}
        <div className="bg-[#FAF7F1] rounded-2xl p-6 border border-[#DFD6C7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-4">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account avatar'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border border-[#DFD6C7] object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#A94424] text-[#FAF7F1] flex items-center justify-center font-serif font-bold text-lg">
                    {(user.displayName || user.email || 'R').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-serif font-bold text-lg text-[#231B15]">
                    {user.displayName || 'Signed-in Subscriber'}
                  </div>
                  <div className="text-xs font-mono text-[#6E6256]">{user.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2.5 rounded-xl border border-[#DFD6C7] bg-[#F4EFE6] hover:border-[#A94424] text-xs font-semibold text-[#A94424] min-h-[44px]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#231B15]">Sync Your Archives</h3>
                <p className="text-sm text-[#6E6256] mt-1">
                  Sign in with Google to synchronize saved clippings and category affinities across devices.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignIn}
                className="px-5 py-2.5 rounded-xl bg-[#A94424] hover:bg-[#8B3218] text-[#FAF7F1] text-xs font-semibold min-h-[44px] whitespace-nowrap"
              >
                Sign In with Google
              </button>
            </>
          )}
        </div>

        {/* Mobile Quick Link to Knowledge Graph */}
        <div className="bg-[#FAF7F1] rounded-2xl p-5 border border-[#DFD6C7] flex items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-base text-[#231B15]">Entity Knowledge Graph</h3>
            <p className="text-xs text-[#6E6256] mt-0.5">
              Map people, organizations, locations, and sentiment across dispatches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNavTab('Graph')}
            className="px-4 py-2 rounded-xl border border-[#DFD6C7] bg-[#F4EFE6] hover:border-[#A94424] text-xs font-semibold text-[#231B15] min-h-[40px] whitespace-nowrap"
          >
            Open Graph →
          </button>
        </div>

        {/* Geographic Scope */}
        <div className="bg-[#FAF7F1] rounded-2xl p-6 border border-[#DFD6C7] space-y-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#231B15]">Geographic Scope</h3>
            <p className="text-xs text-[#6E6256] mt-0.5">Choose between global projections or national focus.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, scope: 'World' }))}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-colors min-h-[44px] ${
                settings.scope === 'World'
                  ? 'border-[#A94424] bg-[#A94424] text-[#FAF7F1]'
                  : 'border-[#DFD6C7] bg-[#F4EFE6] text-[#5C5146] hover:border-[#A94424]'
              }`}
            >
              Global View
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, scope: 'National' }))}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-colors min-h-[44px] ${
                settings.scope === 'National'
                  ? 'border-[#A94424] bg-[#A94424] text-[#FAF7F1]'
                  : 'border-[#DFD6C7] bg-[#F4EFE6] text-[#5C5146] hover:border-[#A94424]'
              }`}
            >
              National Priority
            </button>
          </div>

          {settings.scope === 'National' && (
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#6E6256]">
                Target Country
              </label>
              <select
                value={settings.country || ''}
                onChange={(e) => setSettings((s) => ({ ...s, country: e.target.value }))}
                className="w-full p-3 border border-[#DFD6C7] rounded-xl bg-[#F4EFE6] text-sm text-[#231B15] focus:outline-none focus:border-[#A94424] min-h-[44px]"
              >
                <option value="">Select a country...</option>
                {COUNTRIES.filter((c) => c !== 'Global').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Custom RSS Feed */}
        <div className="bg-[#FAF7F1] rounded-2xl p-6 border border-[#DFD6C7] space-y-3">
          <h3 className="font-serif font-bold text-lg text-[#231B15]">Custom RSS Wire (Optional)</h3>
          <p className="text-xs text-[#6E6256]">
            Enter a direct RSS feed URL to ingest raw news dispatches. Leave blank to use Google News RSS.
          </p>
          <input
            type="url"
            placeholder="https://feeds.bbci.co.uk/news/world/rss.xml"
            value={settings.rssUrl || ''}
            onChange={(e) => setSettings((s) => ({ ...s, rssUrl: e.target.value }))}
            className="w-full px-4 py-3 bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl text-sm text-[#231B15] placeholder-[#9B8E80] focus:outline-none focus:border-[#A94424] min-h-[44px]"
          />
        </div>

        {/* Domain Priority */}
        <div className="bg-[#FAF7F1] rounded-2xl p-6 border border-[#DFD6C7] space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#231B15]">Default Domain Priority</h3>
          <div className="flex flex-wrap gap-2.5">
            {DOMAINS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setSettings((s) => ({ ...s, domain: d }))}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border min-h-[38px] ${
                  settings.domain === d
                    ? 'bg-[#A94424] text-[#FAF7F1] border-[#A94424]'
                    : 'bg-[#F4EFE6] text-[#5C5146] border-[#DFD6C7] hover:border-[#A94424]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Location & Cookie Policy */}
        <div className="bg-[#FAF7F1] rounded-2xl p-6 border border-[#DFD6C7] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#231B15]">Location Services</h3>
              <p className="text-xs text-[#6E6256] mt-0.5">Used to localize regional stories automatically.</p>
            </div>
            <span
              className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                locationPermissionGranted ? 'text-[#52664A]' : 'text-[#A94424]'
              }`}
            >
              {locationPermissionGranted ? 'Active' : 'Unavailable'}
            </span>
          </div>

          <div className="pt-4 border-t border-[#EBE3D5] flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#231B15]">Cookie &amp; Storage Policy</h3>
              <p className="text-xs text-[#6E6256] mt-0.5">Review authentication, offline IndexedDB, and preference storage.</p>
            </div>
            <button
              type="button"
              onClick={() => setCookiePolicyOpen(true)}
              className="px-4 py-2 rounded-xl border border-[#DFD6C7] bg-[#F4EFE6] hover:border-[#A94424] text-xs font-semibold text-[#231B15] min-h-[40px] whitespace-nowrap"
            >
              View Policy
            </button>
          </div>
        </div>
      </div>

      <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#F4EFE6] text-[#231B15] flex overflow-hidden">
      {renderDesktopSidebar()}

      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {renderTopMasthead()}

        {navTab === 'Home' && renderHome()}

        {navTab === 'Events' && (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderSectionStrip()}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DFD6C7] pb-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6E6256] mb-1">
                    Complete Edition Index
                  </div>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#231B15]">World Wire</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setNavTab('Graph')}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F1] border border-[#DFD6C7] hover:border-[#A94424] text-xs font-semibold text-[#231B15] min-h-[40px]"
                >
                  Build Knowledge Graph →
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-[#E7DFD1] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event, idx) => (
                    <EventListRow
                      key={event.id}
                      event={event}
                      index={idx}
                      isSelected={false}
                      onClick={() => setReadingEvent(event)}
                      onOpenArticle={() => setReadingEvent(event)}
                      isSaved={savedEvents.some((e) => e.id === event.id)}
                      onSave={(e) => {
                        e.stopPropagation();
                        toggleSaveEvent(event);
                      }}
                    />
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-12 text-sm text-[#6E6256]">No dispatches found.</div>
                  )}
                </div>
              )}
            </div>
            <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
          </div>
        )}

        {navTab === 'Graph' && (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 min-h-[680px]">
              <KnowledgeGraphView events={events} />
            </div>
            <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
          </div>
        )}

        {navTab === 'Audio' && (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
              <div className="border-b border-[#DFD6C7] pb-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6E6256] mb-1">
                  Spoken Edition
                </div>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#231B15]">
                  Eve AI Briefing Engine
                </h2>
              </div>

              <AudioPlayer
                audioSrc={audioSrc}
                isLoading={isAudioLoading}
                onGenerate={handleGenerateAudio}
                minutes={audioMinutes}
                setMinutes={setAudioMinutes}
                countries={COUNTRIES}
                domains={DOMAINS}
              />
            </div>
            <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
          </div>
        )}

        {navTab === 'Saved' && (
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8">
              <SavedEventsList
                events={savedEvents}
                onSelectEvent={setReadingEvent}
                onRemoveEvent={toggleSaveEvent}
                onBrowseFront={() => setNavTab('Home')}
              />
            </div>
            <EditorialFooter onNavigate={setNavTab} onOpenCookiePolicy={() => setCookiePolicyOpen(true)} />
          </div>
        )}

        {navTab === 'Settings' && renderSettings()}

        {readingEvent && (
          <ArticleReader
            event={readingEvent}
            onClose={() => setReadingEvent(null)}
            onReadTime={handleReadTime}
            isSaved={savedEvents.some((e) => e.id === readingEvent.id)}
            onToggleSave={toggleSaveEvent}
          />
        )}

        {/* Non-intrusive Cookie & Local Storage Notice */}
        {!cookieConsentAccepted && !readingEvent && (
          <div
            role="region"
            aria-label="Cookie and storage notice"
            className="fixed bottom-20 left-3 right-3 md:bottom-5 md:left-auto md:right-6 md:max-w-sm z-40 bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-4 shadow-editorial-lift"
          >
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#A94424] font-semibold">
              Cookie &amp; Offline Storage
            </div>
            <p className="text-xs text-[#3B3027] mt-1 leading-relaxed">
              Event Horizon uses essential cookies and local IndexedDB caching for Google Sign-In and offline
              Saved Briefs—never ad tracking.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCookiePolicyOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-[#DFD6C7] bg-[#F4EFE6] text-[11px] font-semibold text-[#231B15] hover:border-[#A94424] min-h-[36px]"
              >
                Cookie Policy
              </button>
              <button
                type="button"
                onClick={acceptCookieConsent}
                className="px-3.5 py-1.5 rounded-lg bg-[#A94424] hover:bg-[#8B3218] text-[11px] font-semibold text-[#FAF7F1] min-h-[36px]"
              >
                Accept Essential
              </button>
            </div>
          </div>
        )}

        <CookiePolicyModal
          isOpen={cookiePolicyOpen}
          onClose={() => setCookiePolicyOpen(false)}
          onAccept={acceptCookieConsent}
        />

        {renderMobileBottomNav()}
      </div>
    </div>
  );
};

export default App;
