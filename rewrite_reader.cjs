const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { NewsEvent } from '../types';
import { IconHeadphones } from './Icons';
import { generateDetailedReport, generateEventIllustration, generateTTS } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ArticleReaderProps {
  event: NewsEvent;
  onReadTime?: (eventId: string, category: string, timeMs: number) => void;
  onClose: () => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({ event, onClose, onReadTime }) => {
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  const [scrollProgress, setScrollProgress] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
      startTimeRef.current = Date.now();
      return () => {
          const timeSpent = Date.now() - startTimeRef.current;
          if (onReadTime) {
              onReadTime(event.id, event.category, timeSpent);
          }
      };
  }, [event.id, event.category, onReadTime]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const totalScroll = element.scrollTop;
      const windowHeight = element.scrollHeight - element.clientHeight;
      if (windowHeight === 0) return;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(scroll * 100);
  };

  useEffect(() => {
    setLoading(true);
    
    Promise.all([
        generateDetailedReport(event),
        generateEventIllustration(event)
    ]).then(([text, img]) => {
        setContent(text);
        setImageUrl(img);
        setLoading(false);
    });
  }, [event]);

  const handleListen = async () => {
      if (!content) return;
      
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
          return;
      }
      
      setIsAudioLoading(true);
      const audioUrl = await generateTTS(content);
      setIsAudioLoading(false);
      
      if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          audio.play();
          setIsPlaying(true);
      } else {
          alert("Failed to generate audio.");
      }
  };

  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = "";
          }
      }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10 relative pb-safe-top">
            <div className="absolute bottom-0 left-0 h-0.5 bg-theme-purple transition-all duration-100 ease-out" style={{ width: \`\${scrollProgress}%\` }}> </div>
            <div className="flex items-center space-x-4">
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 </button>
                 <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{event.category} Event</span>
                 </div>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handleListen}
                    className="flex items-center space-x-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition-all text-gray-700 font-medium"
                >
                    {isAudioLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-theme-purple rounded-full animate-spin"></div>
                    ) : (
                        <IconHeadphones className="w-3.5 h-3.5" />
                    )}
                    <span>{isAudioLoading ? 'Loading' : isPlaying ? 'Pause' : 'Listen'}</span>
                </button>
            </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white" onScroll={handleScroll}>
            {imageUrl ? (
                <div className="w-full h-64 bg-gray-100 relative">
                    <img src={imageUrl} alt="Generated visual" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>
            ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
            )}
            
            <div className="max-w-2xl mx-auto px-6 py-8 relative -mt-12 bg-white rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                {event.isClickbaitOrPropaganda && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start space-x-3">
                        <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h4 className="font-bold text-sm">Potential Clickbait or Propaganda</h4>
                            <p className="text-sm mt-1">{event.clickbaitWarning || 'This article has been flagged by the system as potentially misleading.'}</p>
                        </div>
                    </div>
                )}
                
                <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-6">
                    {event.headline}
                </h1>
                
                {loading ? (
                     <div className="space-y-4 animate-pulse mt-8">
                         <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                         <div className="w-full h-4 bg-gray-200 rounded"></div>
                         <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                         <div className="w-full h-4 bg-gray-200 rounded mt-8"></div>
                         <div className="w-4/5 h-4 bg-gray-200 rounded"></div>
                     </div>
                ) : (
                     <div className="prose prose-lg prose-gray max-w-none mt-2 prose-a:text-theme-purple prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:bg-theme-purple/5 prose-a:px-1 prose-a:rounded">
                        <ReactMarkdown
                            components={{
                                a: ({node, ...props}) => (
                                    <a target="_blank" rel="noopener noreferrer" title="Reference Source" {...props} className="inline-flex items-center gap-1 group relative">
                                        {props.children}
                                        <svg className="w-3 h-3 text-theme-purple/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                     </div>
                )}

                {/* Event Sources Appendix */}
                {!loading && event.sources && event.sources.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                            <svg className="w-4 h-4 text-theme-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            <span>Reference Sources</span>
                        </h3>
                        <ul className="space-y-3">
                            {event.sources.map((source, i) => (
                                <li key={i}>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-theme-purple flex items-center group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-theme-purple mr-2 transition-colors"></span>
                                        {source.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
`;

fs.writeFileSync('components/ArticleReader.tsx', code);
console.log("Rewrote ArticleReader.tsx to use react-markdown");
