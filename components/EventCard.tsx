import React from 'react';
import { NewsEvent } from '../types';
import { IconBookmark } from './Icons';
import { formatDispatchDate, getPrimarySourceName } from '../utils/editorialMedia';
import { EditorialImage } from './EditorialImage';

interface EventCardProps {
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent) => void;
  event: NewsEvent;
  onClick: () => void;
  isSelected?: boolean;
  size?: 'large' | 'medium';
  index?: number;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  isSaved,
  onSave,
  size = 'large',
  index = 0,
}) => {
  const isLarge = size === 'large';
  const sourceName = getPrimarySourceName(event);
  const dispatchDate = formatDispatchDate(event.timestamp);

  if (isLarge) {
    return (
      <article
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="group bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-4 sm:p-6 shadow-[0_2px_12px_-2px_rgba(35,27,21,0.06)] hover:shadow-[0_8px_24px_-6px_rgba(35,27,21,0.12)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94424]"
      >
        {/* Framed Archival Lead Photograph (locally processed) */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-[#ECE5D8] border border-[#DFD6C7]">
          <EditorialImage
            event={event}
            index={index}
            alt={event.headline}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          {/* Bottom-right archival photo caption chip */}
          <div className="absolute bottom-3 right-3 bg-[#FAF7F1]/95 backdrop-blur-sm border border-[#DFD6C7] px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-[#231B15]">
            Wire · {sourceName}
          </div>

          {onSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave(e);
              }}
              aria-label={isSaved ? 'Remove from archives' : 'Save to archives'}
              className={`absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border transition-colors ${
                isSaved
                  ? 'bg-[#A94424] border-[#A94424] text-[#FAF7F1]'
                  : 'bg-[#FAF7F1]/90 border-[#DFD6C7] text-[#231B15] hover:bg-[#FAF7F1]'
              }`}
            >
              <IconBookmark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lead Editorial Copy */}
        <div className="pt-5 pb-1 text-center max-w-2xl mx-auto">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A94424] mb-2">
            {event.timeSensitivity === 'Critical' || event.timeSensitivity === 'Urgent'
              ? `${event.timeSensitivity} Dispatch`
              : 'Exclusive Report'}
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{event.category}</span>
          </div>

          <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[2.1rem] text-[#231B15] leading-[1.18] tracking-tight text-balance group-hover:text-[#8B3218] transition-colors">
            {event.headline}
          </h2>

          {event.summary && (
            <p className="mt-3 font-serif italic text-sm sm:text-base text-[#5C5146] leading-relaxed line-clamp-2">
              {event.summary}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-[#E8E0D2] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-[#6E6256] tabular-nums">
            <span>By {sourceName}</span>
            <span aria-hidden="true">·</span>
            <span>{event.location || 'Global'}</span>
            <span aria-hidden="true">·</span>
            <span>{dispatchDate}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#A94424] font-semibold">{event.impactScore} Impact</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-3 sm:p-3.5 shadow-[0_2px_10px_-2px_rgba(35,27,21,0.05)] hover:shadow-[0_6px_18px_-4px_rgba(35,27,21,0.1)] transition-all duration-200 cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94424]"
    >
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#ECE5D8] border border-[#E5DDD0] mb-3">
        <EditorialImage
          event={event}
          index={index}
          alt={event.headline}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave(e);
            }}
            aria-label={isSaved ? 'Remove from archives' : 'Save to archives'}
            className={`absolute top-2 right-2 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center border transition-colors ${
              isSaved
                ? 'bg-[#A94424] border-[#A94424] text-[#FAF7F1]'
                : 'bg-[#FAF7F1]/90 border-[#DFD6C7] text-[#231B15] hover:bg-[#FAF7F1]'
            }`}
          >
            <IconBookmark className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A94424] mb-1 truncate">
            {event.category}
          </div>
          <h3 className="font-serif font-bold text-sm sm:text-base text-[#231B15] leading-snug line-clamp-3 group-hover:text-[#8B3218] transition-colors">
            {event.headline}
          </h3>
        </div>

        <div className="mt-3 pt-2 border-t border-[#EBE3D5] flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6E6256] tabular-nums">
          <span className="truncate pr-2">{sourceName}</span>
          <span className="shrink-0 font-semibold text-[#231B15]">{event.impactScore} IMP</span>
        </div>
      </div>
    </article>
  );
};
