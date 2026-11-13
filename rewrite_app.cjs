const fs = require('fs');
let app = fs.readFileSync('App.tsx', 'utf8');

const imports = `import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchNewsProjection, generateBriefingAudio } from './services/geminiService';
import { NewsEvent, ProjectionSettings, ViewMode } from './types';
import { EventCard } from './components/EventCard';
import { EventListRow } from './components/EventListRow';
import { AudioPlayer } from './components/AudioPlayer';
import { IconSearch, IconBookmark, IconWorld, IconMic } from './components/Icons';
import { ArticleReader } from './components/ArticleReader';
import { SavedEventsList } from "./components/SavedEventsList";

const DOMAINS = ["General", "Technology", "Geopolitics", "Economy", "Science"];
const COUNTRIES = ["Global", "United States", "United Kingdom", "China", "Russia"];

// Simple icons for bottom nav
const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
`;

const stateHooks = `const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Discover' | 'Masteries' | 'Recordings' | 'Courses'>('Discover');
  const [navTab, setNavTab] = useState<'Home' | 'Events' | 'Audio' | 'Saved' | 'Profile'>('Home');
  
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
`;

const renderMethods = `
  const renderTopBar = () => (
    <div className="flex items-center justify-between px-4 py-4 bg-white sticky top-0 z-20">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        <UserIcon />
      </div>
      <div className="flex items-center space-x-4 text-theme-text">
        <button><IconSearch className="w-6 h-6" /></button>
        <button><BellIcon /></button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="px-4 pb-2">
      <div className="flex space-x-6 overflow-x-auto hide-scrollbar border-b border-gray-100">
        {['Discover', 'Masteries', 'Recordings', 'Courses'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={\`pb-3 text-lg font-semibold transition-colors \${activeTab === tab ? 'text-theme-text border-b-2 border-theme-text' : 'text-theme-muted'}\`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center text-sm text-theme-muted">
        <span>Browse by language</span>
        <button className="ml-3 px-3 py-1.5 border border-gray-200 rounded-lg flex items-center space-x-1 text-theme-text font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
          <span>English (EN)</span>
        </button>
      </div>
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-30 pb-safe">
      <button onClick={() => setNavTab('Home')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Home' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <HomeIcon />
        <span className="text-[10px] font-medium">Today</span>
      </button>
      <button onClick={() => setNavTab('Events')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Events' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <ListIcon />
        <span className="text-[10px] font-medium">Programs</span>
      </button>
      
      <button onClick={() => setNavTab('Audio')} className="flex flex-col items-center -mt-6">
        <div className="w-14 h-14 bg-theme-purple rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </div>
        <span className={\`text-[10px] font-medium mt-1 \${navTab === 'Audio' ? 'text-theme-purple' : 'text-gray-400'}\`}>Eve AI</span>
      </button>
      
      <button onClick={() => setNavTab('Saved')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Saved' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <IconBookmark className="w-6 h-6" />
        <span className="text-[10px] font-medium">Saved</span>
      </button>
      <button onClick={() => setNavTab('Profile')} className={\`flex flex-col items-center space-y-1 \${navTab === 'Profile' ? 'text-theme-text' : 'text-gray-400'}\`}>
        <UserIcon />
        <span className="text-[10px] font-medium">Community</span>
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto pb-24">
      {renderTopBar()}
      {renderTabs()}
      
      <div className="px-4 mt-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold text-theme-text">Trending Globally</h2>
            <p className="text-sm text-theme-muted mt-1 leading-snug">Update your location to see the latest trending programs in your country.</p>
          </div>
          <button className="text-theme-text"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
        </div>
        
        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4">
             {[1,2,3].map(i => <div key={i} className="w-[280px] h-[220px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0"></div>)}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4">
            {events.slice(0, 5).map((event, index) => (
              <EventCard 
                key={event.id} 
                event={event} 
                size="large"
                onClick={() => setReadingEvent(event)}
                isSaved={savedEvents.some(e => e.id === event.id)}
                onSave={(e) => { e.stopPropagation(); toggleSaveEvent(event); }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold text-theme-text">Popular now</h2>
            <p className="text-sm text-theme-muted mt-1 leading-snug">Update your profile to get personalized program recommendations.</p>
          </div>
          <button className="text-theme-text"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
        </div>
        
        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4">
             {[1,2,3].map(i => <div key={i} className="w-[240px] h-[180px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0"></div>)}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4">
            {events.slice(5, 12).map((event, index) => (
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
    </div>
  );

  return (
    <div className="h-screen w-full bg-white flex flex-col font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {navTab === 'Home' && renderHome()}
      {navTab === 'Events' && (
        <div className="flex-1 overflow-y-auto pb-24 px-4 pt-8">
            <h2 className="text-2xl font-bold mb-4">All Programs</h2>
            {events.map(event => (
              <EventListRow 
                 key={event.id} 
                 event={event} 
                 isSelected={false} 
                 onClick={() => setReadingEvent(event)} 
                 onOpenArticle={() => setReadingEvent(event)} 
              />
            ))}
        </div>
      )}
      {navTab === 'Audio' && (
        <div className="flex-1 overflow-y-auto pb-24 p-4 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4">Eve AI</h2>
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
        <div className="flex-1 overflow-y-auto pb-24 p-4">
           <h2 className="text-2xl font-bold mb-4">Saved Meditations</h2>
           <SavedEventsList 
              events={savedEvents} 
              onSelectEvent={setReadingEvent} 
              onRemoveEvent={toggleSaveEvent} 
           />
        </div>
      )}

      {readingEvent && (
        <ArticleReader event={readingEvent} onClose={() => setReadingEvent(null)} />
      )}

      {renderBottomNav()}
    </div>
  );
};

export default App;
`;

fs.writeFileSync('App.tsx', imports + stateHooks + renderMethods);
console.log("Rewrote App.tsx");
