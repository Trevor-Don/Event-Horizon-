const fs = require('fs');

const code = `import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchNewsProjection, generateBriefingAudio } from './services/geminiService';
import { NewsEvent, ProjectionSettings, ViewMode } from './types';
import { EventCard } from './components/EventCard';
import { EventListRow } from './components/EventListRow';
import { AudioPlayer } from './components/AudioPlayer';
import { IconSearch, IconBookmark, IconWorld, IconMic } from './components/Icons';
import { ArticleReader } from './components/ArticleReader';
import { SavedEventsList } from "./components/SavedEventsList";

const DOMAINS = ["General", "Technology", "Geopolitics", "Economy", "Science", "Culture", "Environment"];
const COUNTRIES = ["Global", "United States", "United Kingdom", "China", "Russia", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "South Africa"];

const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AudioIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Discover' | 'Masteries' | 'Recordings' | 'Courses'>('Discover');
  const [navTab, setNavTab] = useState<'Home' | 'Events' | 'Audio' | 'Saved' | 'Settings'>('Home');
  
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);

  const [settings, setSettings] = useState<ProjectionSettings>({
    scope: 'World',
    country: '',
    domain: 'General',
    timeBudget: 5
  });
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioMinutes, setAudioMinutes] = useState(3);
  const [readingEvent, setReadingEvent] = useState<NewsEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setEvents([]);
    const data = await fetchNewsProjection(settings);
    setEvents(data);
    if (data.length > 0) setSelectedEventId(data[0].id);
    setIsLoading(false);
  }, [settings]);

  // Initial Geo-location
  useEffect(() => {
    setGeoLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
           setLocationPermissionGranted(true);
           try {
             const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${position.coords.latitude}&lon=\${position.coords.longitude}\`);
             const data = await res.json();
             if (data.address && data.address.country) {
                setSettings(s => ({ ...s, country: data.address.country, scope: 'National' }));
             } else {
                setSettings(s => ({ ...s, scope: 'World' }));
             }
           } catch (e) {
             console.error(e);
             setSettings(s => ({ ...s, scope: 'World' }));
           }
           setGeoLocating(false);
        },
        (error) => {
           console.log("Geolocation denied or error, defaulting to Global");
           setLocationPermissionGranted(false);
           setSettings(s => ({ ...s, scope: 'World' }));
           setGeoLocating(false);
        }
      );
    } else {
        setGeoLocating(false);
        setSettings(s => ({ ...s, scope: 'World' }));
    }
  }, []);

  useEffect(() => {
    if (!geoLocating) {
       loadEvents();
    }
  }, [geoLocating, loadEvents]);

  const toggleSaveEvent = (event: NewsEvent) => {
      setSavedEvents(prev => {
          if (prev.some(e => e.id === event.id)) {
              return prev.filter(e => e.id !== event.id);
          } else {
              return [...prev, event];
          }
      });
  };

  const handleGenerateAudio = async (opts: { country: string; domain: string; voice: string; minutes: number }) => {
      setIsAudioLoading(true);
      const url = await generateBriefingAudio(events, opts.minutes, opts.voice);
      if (url) {
          setAudioSrc(url);
          setNavTab('Audio');
      }
      setIsAudioLoading(false);
  };

  const renderTopBar = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-20 border-b border-gray-100">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        <UserIcon />
      </div>
      <div className="hidden md:flex flex-col items-center">
         <h1 className="text-xl font-bold text-gray-900 tracking-tight">Event Horizon</h1>
         <span className="text-[10px] text-gray-500 uppercase tracking-widest">{settings.scope === 'National' && settings.country ? settings.country : 'Global'} | {settings.domain}</span>
      </div>
      <div className="flex items-center space-x-4 text-theme-text">
        <button><IconSearch className="w-6 h-6" /></button>
        <button><BellIcon /></button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="px-6 py-4 border-b border-gray-100 bg-white">
      <div className="flex space-x-8 overflow-x-auto hide-scrollbar">
        {['Discover', 'Local', 'Global', 'Tech'].map(tab => {
            const isActive = 
                (tab === 'Discover' && settings.domain === 'General' && settings.scope === 'World') ||
                (tab === 'Local' && settings.scope === 'National') ||
                (tab === 'Global' && settings.scope === 'World' && settings.domain !== 'General') ||
                (tab === 'Tech' && settings.domain === 'Technology');

            return (
                <button 
                    key={tab}
                    onClick={() => {
                        if (tab === 'Discover') setSettings(s => ({ ...s, scope: 'World', domain: 'General' }));
                        if (tab === 'Local') setSettings(s => ({ ...s, scope: 'National' }));
                        if (tab === 'Global') setSettings(s => ({ ...s, scope: 'World', domain: 'Geopolitics' }));
                        if (tab === 'Tech') setSettings(s => ({ ...s, domain: 'Technology' }));
                    }}
                    className={\`pb-2 text-lg font-semibold transition-colors whitespace-nowrap \${isActive ? 'text-theme-text border-b-2 border-theme-purple' : 'text-theme-muted hover:text-gray-800'}\`}
                >
                    {tab}
                </button>
            )
        })}
      </div>
      <div className="mt-4 flex items-center text-sm text-theme-muted">
        <span>Priority Settings</span>
        <button onClick={() => setNavTab('Settings')} className="ml-3 px-3 py-1.5 border border-gray-200 rounded-lg flex items-center space-x-1 text-theme-text font-medium hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          <span>{settings.domain} • {settings.scope === 'National' && settings.country ? settings.country : 'Global'}</span>
        </button>
      </div>
    </div>
  );

  const renderSidebarNav = () => (
    <div className="hidden md:flex w-64 bg-gray-50 border-r border-gray-200 flex-col py-6">
        <div className="px-6 mb-8 flex items-center space-x-3">
             <div className="w-8 h-8 rounded-lg bg-theme-purple flex items-center justify-center text-white font-bold">EH</div>
             <span className="text-xl font-bold tracking-tight text-gray-900">Event Horizon</span>
        </div>
        
        <div className="flex flex-col space-y-2 px-4">
            <button onClick={() => setNavTab('Home')} className={\`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${navTab === 'Home' ? 'bg-white shadow-sm text-theme-purple font-semibold' : 'text-gray-600 hover:bg-gray-100'}\`}>
                <HomeIcon />
                <span>Today</span>
            </button>
            <button onClick={() => setNavTab('Events')} className={\`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${navTab === 'Events' ? 'bg-white shadow-sm text-theme-purple font-semibold' : 'text-gray-600 hover:bg-gray-100'}\`}>
                <ListIcon />
                <span>All Events</span>
            </button>
            <button onClick={() => setNavTab('Audio')} className={\`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${navTab === 'Audio' ? 'bg-white shadow-sm text-theme-purple font-semibold' : 'text-gray-600 hover:bg-gray-100'}\`}>
                <AudioIcon />
                <span>Eve AI Briefing</span>
            </button>
            <button onClick={() => setNavTab('Saved')} className={\`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${navTab === 'Saved' ? 'bg-white shadow-sm text-theme-purple font-semibold' : 'text-gray-600 hover:bg-gray-100'}\`}>
                <IconBookmark className="w-6 h-6" />
                <span>Saved Briefs</span>
            </button>
            <button onClick={() => setNavTab('Settings')} className={\`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all \${navTab === 'Settings' ? 'bg-white shadow-sm text-theme-purple font-semibold' : 'text-gray-600 hover:bg-gray-100'}\`}>
                <SettingsIcon />
                <span>Settings</span>
            </button>
        </div>
    </div>
  );

  const renderBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-30 pb-6">
      <button onClick={() => setNavTab('Home')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Home' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <HomeIcon />
        <span className="text-[10px] font-medium">Today</span>
      </button>
      <button onClick={() => setNavTab('Events')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Events' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <ListIcon />
        <span className="text-[10px] font-medium">Events</span>
      </button>
      
      <button onClick={() => setNavTab('Audio')} className="flex flex-col items-center -mt-6">
        <div className="w-14 h-14 bg-theme-purple rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
          <AudioIcon />
        </div>
        <span className={\`text-[10px] font-medium mt-1 \${navTab === 'Audio' ? 'text-theme-purple' : 'text-gray-400'}\`}>Eve AI</span>
      </button>
      
      <button onClick={() => setNavTab('Saved')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Saved' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <IconBookmark className="w-6 h-6" />
        <span className="text-[10px] font-medium">Saved</span>
      </button>
      <button onClick={() => setNavTab('Settings')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Settings' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <SettingsIcon />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="md:hidden">{renderTopBar()}</div>
      {renderTabs()}
      
      {geoLocating ? (
        <div className="px-6 mt-12 flex flex-col items-center justify-center space-y-4">
           <div className="w-8 h-8 border-4 border-gray-200 border-t-theme-purple rounded-full animate-spin"></div>
           <p className="text-sm text-gray-500">Detecting location for personalized news...</p>
        </div>
      ) : (
        <>
          <div className="px-6 mt-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-theme-text">
                   {settings.scope === 'National' && settings.country ? \`Trending in \${settings.country}\` : 'Trending Globally'}
                </h2>
                <p className="text-sm text-theme-muted mt-1 leading-snug">
                   {settings.scope === 'National' 
                     ? 'Top stories matching your geographic location.' 
                     : 'Update your priority settings to see local news.'}
                </p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4">
                {[1,2,3].map(i => <div key={i} className="w-[280px] h-[220px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0"></div>)}
              </div>
            ) : (
              <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
                {events.slice(0, 5).map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    size="large"
                    onClick={() => setReadingEvent(event)}
                    isSaved={savedEvents.some(e => e.id === event.id)}
                    onSave={(e) => { e.stopPropagation(); toggleSaveEvent(event); }}
                  />
                ))}
                {events.length === 0 && <div className="text-gray-500 py-10">No events found matching your criteria.</div>}
              </div>
            )}
          </div>

          <div className="px-6 mt-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-theme-text">High Impact Events</h2>
                <p className="text-sm text-theme-muted mt-1 leading-snug">Events with significant projected consequences.</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4">
                {[1,2,3].map(i => <div key={i} className="w-[240px] h-[180px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0"></div>)}
              </div>
            ) : (
              <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
                {events.slice(5, 12).map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    size="medium"
                    onClick={() => setReadingEvent(event)}
                    isSaved={savedEvents.some(e => e.id === event.id)}
                    onSave={(e) => { e.stopPropagation(); toggleSaveEvent(event); }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8 bg-gray-50 p-6">
       <div className="max-w-2xl mx-auto">
           <h2 className="text-2xl font-bold text-gray-900 mb-6">Priority & Configuration</h2>
           
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-semibold mb-4">Geographic Scope</h3>
               <div className="flex space-x-4 mb-6">
                   <button 
                       onClick={() => setSettings(s => ({ ...s, scope: 'World' }))}
                       className={\`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors \${settings.scope === 'World' ? 'border-theme-purple bg-theme-purple/5 text-theme-purple' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}\`}
                   >
                       Global View
                   </button>
                   <button 
                       onClick={() => setSettings(s => ({ ...s, scope: 'National' }))}
                       className={\`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors \${settings.scope === 'National' ? 'border-theme-purple bg-theme-purple/5 text-theme-purple' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}\`}
                   >
                       Local Priority
                   </button>
               </div>

               {settings.scope === 'National' && (
                   <div className="space-y-3">
                       <label className="text-sm font-medium text-gray-700">Set Custom Country</label>
                       <select 
                           value={settings.country || ''} 
                           onChange={(e) => setSettings(s => ({ ...s, country: e.target.value }))}
                           className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-purple/50"
                       >
                           <option value="">Select a country...</option>
                           {COUNTRIES.filter(c => c !== 'Global').map(c => (
                               <option key={c} value={c}>{c}</option>
                           ))}
                       </select>
                   </div>
               )}
           </div>

           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-semibold mb-4">Default Domain Priority</h3>
               <div className="flex flex-wrap gap-3">
                   {DOMAINS.map(d => (
                       <button 
                           key={d}
                           onClick={() => setSettings(s => ({ ...s, domain: d }))}
                           className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors border \${settings.domain === d ? 'bg-theme-purple text-white border-theme-purple' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}\`}
                       >
                           {d}
                       </button>
                   ))}
               </div>
           </div>

           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold mb-4">System Status</h3>
               <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                       <div className="flex items-center space-x-3">
                           <div className={\`w-2 h-2 rounded-full \${locationPermissionGranted ? 'bg-green-500' : 'bg-red-500'}\`}></div>
                           <span className="text-sm font-medium text-gray-700">Location Services</span>
                       </div>
                       <span className="text-xs text-gray-500">{locationPermissionGranted ? 'Active' : 'Denied / Unavailable'}</span>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-white flex font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      {renderSidebarNav()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {navTab === 'Home' && renderHome()}
        
        {navTab === 'Events' && (
          <div className="flex-1 overflow-y-auto pb-24 md:pb-8 px-6 pt-8 max-w-4xl mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tracked Events</h2>
              {isLoading ? (
                  <div className="space-y-4">
                      {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
                  </div>
              ) : (
                  <div className="space-y-4">
                      {events.map(event => (
                        <EventListRow 
                           key={event.id} 
                           event={event} 
                           isSelected={false} 
                           onClick={() => setReadingEvent(event)} 
                           onOpenArticle={() => setReadingEvent(event)} 
                        />
                      ))}
                      {events.length === 0 && <div className="text-gray-500 py-10">No events found.</div>}
                  </div>
              )}
          </div>
        )}

        {navTab === 'Audio' && (
          <div className="flex-1 overflow-y-auto pb-24 md:pb-8 max-w-2xl mx-auto w-full pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 px-6">Eve AI Briefing Engine</h2>
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
        )}

        {navTab === 'Saved' && (
          <div className="flex-1 overflow-y-auto pb-24 md:pb-8 px-6 pt-8 max-w-4xl mx-auto w-full">
             <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Intelligence Briefs</h2>
             <SavedEventsList 
                events={savedEvents} 
                onSelectEvent={setReadingEvent} 
                onRemoveEvent={toggleSaveEvent} 
             />
          </div>
        )}

        {navTab === 'Settings' && renderSettings()}

        {readingEvent && (
          <ArticleReader event={readingEvent} onClose={() => setReadingEvent(null)} />
        )}

        {/* Mobile Bottom Nav */}
        {renderBottomNav()}
      </div>
    </div>
  );
};

export default App;
`

fs.writeFileSync('App.tsx', code);
console.log("Rewrote App.tsx");
