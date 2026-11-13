const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// Update search functionality
const searchState = `
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
`;

if (!code.includes('searchQuery')) {
    code = code.replace(
        'const [readingEvent, setReadingEvent] = useState<NewsEvent | null>(null);',
        'const [readingEvent, setReadingEvent] = useState<NewsEvent | null>(null);\n' + searchState
    );
}

// Update settings state to include user preferences loaded from localStorage
const settingsEffect = `
  useEffect(() => {
     try {
         const prefs = localStorage.getItem('eh_user_prefs');
         if (prefs) {
             setSettings(s => ({ ...s, userPreferences: JSON.parse(prefs) }));
         }
     } catch (e) {}
  }, []);
`;
if (!code.includes('eh_user_prefs')) {
    code = code.replace(
        '// Initial Geo-location',
        settingsEffect + '\n  // Initial Geo-location'
    );
}

// Track read time function
const trackReadTimeFn = `
  const handleReadTime = useCallback((eventId: string, category: string, timeMs: number) => {
      // Give more weight if they spend more than 5 seconds
      if (timeMs > 5000) {
          setSettings(prev => {
              const currentPrefs = prev.userPreferences || {};
              const currentWeight = currentPrefs[category] || 1.0;
              // Increase weight by 10% per 30 seconds spent reading, cap at 5.0
              const increase = Math.min(0.5, (timeMs / 30000) * 0.1);
              const newPrefs = { ...currentPrefs, [category]: Math.min(5.0, currentWeight + increase) };
              
              localStorage.setItem('eh_user_prefs', JSON.stringify(newPrefs));
              return { ...prev, userPreferences: newPrefs };
          });
      }
  }, []);
`;
if (!code.includes('handleReadTime')) {
    code = code.replace(
        'const handleGenerateAudio = async',
        trackReadTimeFn + '\n  const handleGenerateAudio = async'
    );
}

// Pass onReadTime to ArticleReader
code = code.replace(
    '<ArticleReader event={readingEvent} onClose={() => setReadingEvent(null)} />',
    '<ArticleReader event={readingEvent} onClose={() => setReadingEvent(null)} onReadTime={handleReadTime} />'
);

// Search submission
const handleSearchSubmit = `
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          setSettings(s => ({ ...s, searchQuery: searchQuery.trim(), domain: 'General' }));
          setNavTab('Home');
          setIsSearching(false);
      }
  };
`;
if (!code.includes('handleSearchSubmit')) {
    code = code.replace(
        'const renderTopBar = () => (',
        handleSearchSubmit + '\n  const renderTopBar = () => ('
    );
}

// Update renderTopBar to include Search Input
const newTopBar = `
  const renderTopBar = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
        <UserIcon />
      </div>
      
      {isSearching ? (
          <form onSubmit={handleSearchSubmit} className="flex-1 mx-4 flex items-center">
              <input 
                  type="text" 
                  autoFocus
                  placeholder="Search events, topics..." 
                  className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-purple"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="button" onClick={() => { setIsSearching(false); setSearchQuery(''); setSettings(s => ({ ...s, searchQuery: '' })); }} className="ml-2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </form>
      ) : (
          <div className="flex flex-col items-center flex-1">
             <h1 className="text-xl font-bold text-gray-900 tracking-tight">Event Horizon</h1>
             <span className="text-[10px] text-gray-500 uppercase tracking-widest">{settings.searchQuery ? 'Search Results' : (settings.scope === 'National' && settings.country ? settings.country : 'Global')} | {settings.domain}</span>
          </div>
      )}

      {!isSearching && (
          <div className="flex items-center space-x-4 text-theme-text flex-shrink-0">
            <button onClick={() => setIsSearching(true)}><IconSearch className="w-6 h-6" /></button>
            <button><BellIcon /></button>
          </div>
      )}
    </div>
  );
`;

const oldTopBarRegex = /const renderTopBar = \(\) => \([\s\S]*?\n  \);/m;
code = code.replace(oldTopBarRegex, newTopBar.trim());

// Update renderHome search title
code = code.replace(
    `{settings.scope === 'National' && settings.country ? \`Trending in \${settings.country}\` : 'Trending Globally'}`,
    `{settings.searchQuery ? \`Results for "\${settings.searchQuery}"\` : (settings.scope === 'National' && settings.country ? \`Trending in \${settings.country}\` : 'Trending Globally')}`
);
code = code.replace(
    `{settings.scope === 'National' \n                     ? 'Top stories matching your geographic location.' \n                     : 'Update your priority settings to see local news.'}`,
    `{settings.searchQuery ? 'Top relevant events matching your search.' : (settings.scope === 'National' \n                     ? 'Top stories matching your geographic location.' \n                     : 'Update your priority settings to see local news.')}`
);

fs.writeFileSync('App.tsx', code);
console.log("Updated App.tsx");
