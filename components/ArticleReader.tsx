import React, { useState, useEffect, useRef } from 'react';
import { NewsEvent } from '../types';
import { IconBookmark, IconHeadphones } from './Icons';
import { generateDetailedReport, generateTTS } from '../services/geminiService';
import { formatDispatchDate, getPrimarySourceName } from '../utils/editorialMedia';
import { EditorialImage } from './EditorialImage';
import ReactMarkdown from 'react-markdown';

interface ArticleReaderProps {
  event: NewsEvent;
  onReadTime?: (eventId: string, category: string, timeMs: number) => void;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (event: NewsEvent) => void;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  event,
  onClose,
  onReadTime,
  isSaved,
  onToggleSave,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (windowHeight <= 0) {
      setScrollProgress(0);
      return;
    }
    const scroll = Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100));
    setScrollProgress(scroll);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    generateDetailedReport(event).then((text) => {
      if (cancelled) return;
      setContent(text);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [event]);

  const handleListen = async () => {
    if (!content) return;
    setAudioError(null);

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setAudioError('Playback was blocked by the browser.'));
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
      audio.play().catch(() => setAudioError('Unable to start audio playback.'));
      setIsPlaying(true);
    } else {
      setAudioError('Audio synthesis is unavailable right now. Please try again shortly.');
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleDownload = () => {
    const textContent = `# ${event.headline}\n\nSource: ${getPrimarySourceName(event)} | Date: ${formatDispatchDate(event.timestamp)}\n\n${content}`;
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.headline.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sourceName = getPrimarySourceName(event);
  const dispatchDate = formatDispatchDate(event.timestamp);

  return (
    <div className="fixed inset-0 z-[100] bg-[#F4EFE6] text-[#231B15] flex flex-col">
      {/* Top Dispatch Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#DFD6C7] flex items-center justify-between relative z-20 flex-shrink-0">
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-[#A94424] transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-[#231B15] hover:text-[#A94424] min-h-[44px] pr-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Dispatch</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !content}
            title="Download Markdown for offline reading"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-[#D8CFC0] bg-[#FAF7F1] text-[#231B15] hover:border-[#A94424] disabled:opacity-40 transition-colors min-h-[40px]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </button>

          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(event)}
              aria-label={isSaved ? 'Remove from archives' : 'Save to archives'}
              title={isSaved ? 'Saved in Archives' : 'Save to Archives'}
              className={`min-w-[40px] min-h-[40px] rounded-full border flex items-center justify-center transition-colors ${
                isSaved
                  ? 'bg-[#FAF7F1] border-[#A94424] text-[#A94424]'
                  : 'bg-[#FAF7F1] border-[#D8CFC0] text-[#5C5146] hover:border-[#A94424]'
              }`}
            >
              <IconBookmark className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleListen}
            disabled={loading || !content}
            title={isPlaying ? 'Pause audio narration' : 'Listen to dispatch'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#8B3218] hover:bg-[#A94424] text-[#FAF7F1] text-xs font-semibold transition-colors disabled:opacity-40 min-h-[40px] shadow-sm"
          >
            {isAudioLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#FAF7F1]/40 border-t-[#FAF7F1] rounded-full animate-spin" />
            ) : (
              <IconHeadphones className="w-3.5 h-3.5" />
            )}
            <span>{isAudioLoading ? 'Loading' : isPlaying ? 'Pause' : 'Listen'}</span>
          </button>
        </div>
      </header>

      {/* Scrollable Dispatch Body + Right Margin Ruler */}
      <div className="flex-1 relative overflow-y-auto" onScroll={handleScroll}>
        {/* Right-edge Reading Progress Ruler (matching Vintage Editorial Dispatch motif) */}
        <aside
          aria-hidden="true"
          className="hidden sm:flex fixed right-2 lg:right-6 top-20 bottom-10 w-6 flex-col justify-between items-end pointer-events-none z-10 border-r border-[#DFD6C7] pr-1.5"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={`block h-[1px] bg-[#CFC4B2] ${i % 3 === 0 ? 'w-3' : 'w-1.5'}`}
            />
          ))}
          <div
            className="absolute right-0 flex items-center gap-1 transition-all duration-100"
            style={{ top: `calc(${scrollProgress}% - 6px)` }}
          >
            <span className="text-[9px] font-mono text-[#A94424] font-semibold tabular-nums">
              {Math.round(scrollProgress)}%
            </span>
            <span className="w-3 h-[2px] bg-[#A94424]" />
          </div>
        </aside>

        <article className="max-w-3xl mx-auto px-5 sm:px-10 py-8 sm:py-12">
          {audioError && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-[#FAF7F1] border border-[#A94424]/40 text-xs text-[#8B3218] flex items-center justify-between gap-4">
              <span>{audioError}</span>
              <button
                type="button"
                onClick={() => setAudioError(null)}
                className="font-semibold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {event.isClickbaitOrPropaganda && (
            <div className="bg-[#FAF7F1] border border-[#A94424]/40 text-[#8B3218] px-4 py-3.5 rounded-xl mb-8 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#A94424] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Editorial Advisory</h4>
                <p className="text-sm mt-1 leading-relaxed">
                  {event.clickbaitWarning || 'This dispatch has been flagged for potential sensationalism or bias.'}
                </p>
              </div>
            </div>
          )}

          {/* Centered Broadsheet Dispatch Header */}
          <div className="text-center max-w-2xl mx-auto pb-7 border-b border-[#DFD6C7]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A94424] mb-3">
              Special Dispatch · {event.category}
            </div>

            <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-[2.75rem] text-[#231B15] leading-[1.15] tracking-tight text-balance">
              {event.headline}
            </h1>

            <div className="w-12 h-[1px] bg-[#CFC4B2] mx-auto my-5" />

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-[0.14em] text-[#6E6256] tabular-nums">
              <span>By {sourceName}</span>
              <span aria-hidden="true">·</span>
              <span>{dispatchDate}</span>
              {event.location && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{event.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Framed Archival Figure (locally processed) */}
          <figure className="my-8 max-w-2xl mx-auto">
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#ECE5D8] border border-[#DFD6C7] shadow-sm">
              <EditorialImage
                event={event}
                index={0}
                alt={event.headline}
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs font-serif italic text-[#6E6256] text-center">
              Fig. 1 — {event.category} dispatch print · Impact rating {event.impactScore}/100
            </figcaption>
          </figure>

          {/* Editorial Body Prose with Drop Cap */}
          {loading ? (
            <div className="max-w-[65ch] mx-auto space-y-4 animate-pulse mt-8">
              <div className="w-3/4 h-4 bg-[#E5DDD0] rounded" />
              <div className="w-full h-4 bg-[#E5DDD0] rounded" />
              <div className="w-5/6 h-4 bg-[#E5DDD0] rounded" />
              <div className="w-full h-4 bg-[#E5DDD0] rounded mt-8" />
              <div className="w-4/5 h-4 bg-[#E5DDD0] rounded" />
            </div>
          ) : (
            <div className="max-w-[65ch] mx-auto prose prose-lg prose-stone font-serif text-[17px] sm:text-[18px] leading-[1.82] text-[#2B221B] prose-headings:font-serif prose-headings:text-[#231B15] prose-strong:text-[#231B15] [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1.5 [&>p:first-of-type]:first-letter:leading-[0.82] [&>p:first-of-type]:first-letter:text-[#231B15]">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => {
                    let hostname = props.href || '';
                    try {
                      if (props.href) hostname = new URL(props.href).hostname.replace('www.', '');
                    } catch (e) {}

                    return (
                      <span className="relative inline-block group ml-1">
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={props.href}
                          className="inline-flex items-center justify-center text-[11px] font-sans px-1.5 py-0.5 rounded bg-[#FAF7F1] text-[#A94424] border border-[#DFD6C7] hover:bg-[#A94424] hover:text-[#FAF7F1] transition-colors align-baseline font-semibold no-underline cursor-pointer"
                        >
                          {props.children || hostname || 'Source'}
                          <svg className="w-2.5 h-2.5 ml-0.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </span>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {/* Reference Sources Appendix */}
          {!loading && event.sources && event.sources.length > 0 && (
            <footer className="max-w-[65ch] mx-auto mt-12 pt-8 border-t border-[#DFD6C7]">
              <h3 className="text-xs font-mono font-semibold text-[#6E6256] uppercase tracking-[0.16em] mb-4">
                Primary Reference Sources
              </h3>
              <ul className="space-y-2.5">
                {event.sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-serif text-[#231B15] hover:text-[#A94424] inline-flex items-center gap-2 underline decoration-[#DFD6C7] underline-offset-4 transition-colors"
                    >
                      <span className="font-mono text-[11px] text-[#6E6256] tabular-nums">[{i + 1}]</span>
                      <span>{source.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </article>
      </div>
    </div>
  );
};
