import React, { useMemo, useState } from 'react';
import { NewsEvent } from '../types';
import { IconBookmark } from './Icons';
import { formatDispatchDate, getPrimarySourceName } from '../utils/editorialMedia';

interface SavedEventsListProps {
  events: NewsEvent[];
  onSelectEvent: (event: NewsEvent) => void;
  onRemoveEvent: (event: NewsEvent) => void;
  onBrowseFront?: () => void;
}

const getCategoryDotClass = (category: string) => {
  switch (category) {
    case 'Geopolitics':
      return 'bg-[#A94424] text-[#FAF7F1]';
    case 'Technology':
      return 'bg-[#2B4C7E] text-[#FAF7F1]';
    case 'Economy':
      return 'bg-[#52664A] text-[#FAF7F1]';
    case 'Science':
      return 'bg-[#7A5C3E] text-[#FAF7F1]';
    default:
      return 'bg-[#6E6256] text-[#FAF7F1]';
  }
};

export const SavedEventsList: React.FC<SavedEventsListProps> = ({
  events,
  onSelectEvent,
  onRemoveEvent,
  onBrowseFront,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
    return ['All', ...unique];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'All') return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="text-center border-b border-[#DFD6C7] pb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6E6256] mb-1.5">
          Personal Collection &amp; Curated Dispatches
        </div>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[#231B15]">
          The Archives
        </h2>
        <p className="text-xs font-mono text-[#6E6256] mt-2 tabular-nums">
          {events.length} {events.length === 1 ? 'Saved Clipping' : 'Saved Clippings'} · Offline Cached
        </p>

        {/* Functional Category Filter Buttons */}
        {events.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors min-h-[36px] whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#A94424] text-[#FAF7F1]'
                      : 'bg-[#FAF7F1] border border-[#D8CFC0] text-[#5C5146] hover:border-[#A94424] hover:text-[#231B15]'
                  }`}
                >
                  {cat === 'All' ? 'All Dispatches' : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Archival Clipping Grid */}
      {events.length === 0 ? (
        <div className="max-w-md mx-auto py-10 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F1] border border-[#DFD6C7] flex items-center justify-center text-[#A94424]">
            <IconBookmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#231B15]">No clippings archived yet</h3>
            <p className="text-sm text-[#6E6256] mt-1.5 leading-relaxed">
              Bookmark stories from the Front Page or World Wire to store them locally for offline reading.
            </p>
          </div>
          {onBrowseFront && (
            <button
              type="button"
              onClick={onBrowseFront}
              className="px-5 py-2.5 rounded-xl bg-[#A94424] text-[#FAF7F1] text-sm font-semibold hover:bg-[#8B3218] transition-colors min-h-[44px]"
            >
              Browse Front Page
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pt-1">
          {filteredEvents.map((event, idx) => (
            <article
              key={event.id}
              onClick={() => onSelectEvent(event)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEvent(event);
                }
              }}
              className={`group relative bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-4 shadow-[0_2px_10px_rgba(35,27,21,0.05)] hover:shadow-[0_8px_20px_rgba(35,27,21,0.1)] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[168px] ${
                idx % 2 === 0 ? 'sm:-rotate-[0.6deg]' : 'sm:rotate-[0.6deg]'
              } hover:rotate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94424]`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${getCategoryDotClass(
                      event.category
                    )}`}
                    title={event.category}
                  >
                    {(event.category || 'G').charAt(0)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveEvent(event);
                    }}
                    aria-label="Remove clipping from archives"
                    title="Remove clipping"
                    className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-[#A94424] hover:bg-[#ECE5D8] transition-colors"
                  >
                    <IconBookmark className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-serif font-bold text-sm sm:text-[15px] text-[#231B15] leading-snug line-clamp-3 group-hover:text-[#8B3218] transition-colors">
                  {event.headline}
                </h3>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#EBE3D5] flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-[#6E6256] tabular-nums">
                <span className="truncate">{formatDispatchDate(event.timestamp)}</span>
                <span className="truncate max-w-[80px] text-right">{getPrimarySourceName(event)}</span>
              </div>
            </article>
          ))}

          {/* Add Clipping Slot */}
          {onBrowseFront && (
            <button
              type="button"
              onClick={onBrowseFront}
              className="border-2 border-dashed border-[#CFC4B2] bg-[#ECE5D8]/40 hover:bg-[#ECE5D8]/80 hover:border-[#A94424] rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[168px] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full border border-[#CFC4B2] bg-[#FAF7F1] flex items-center justify-center text-[#6E6256] group-hover:text-[#A94424] group-hover:border-[#A94424] transition-colors mb-2.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5C5146] group-hover:text-[#231B15] font-semibold">
                Add Clipping
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
