import React from 'react';
import { NewsEvent } from '../types';
import { formatDispatchDate, getPrimarySourceName } from '../utils/editorialMedia';
import { IconBookmark } from './Icons';

interface EventListRowProps {
  event: NewsEvent;
  onClick: () => void;
  onOpenArticle: () => void;
  isSelected: boolean;
  isSaved?: boolean;
  onSave?: (e: React.MouseEvent) => void;
  index?: number;
}

export const EventListRow: React.FC<EventListRowProps> = ({
  event,
  onOpenArticle,
  isSaved,
  onSave,
  index,
}) => {
  const sourceName = getPrimarySourceName(event);
  const dateLabel = formatDispatchDate(event.timestamp);

  return (
    <div
      onClick={onOpenArticle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenArticle();
        }
      }}
      className="group bg-[#FAF7F1] hover:bg-[#FFFFFF] rounded-xl cursor-pointer transition-all duration-150 border border-[#DFD6C7] hover:border-[#C5B9A5] shadow-[0_1px_6px_rgba(35,27,21,0.04)] p-4 flex gap-3.5 sm:gap-4 items-start sm:items-center min-h-[64px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94424]"
    >
      <div className="w-10 h-10 rounded-full border border-[#DFD6C7] bg-[#F4EFE6] flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm text-[#231B15] tabular-nums">
        {typeof index === 'number' ? String(index + 1).padStart(2, '0') : event.headline?.charAt(0) || 'D'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-mono uppercase tracking-wider text-[#6E6256] mb-1 tabular-nums">
          <span className="text-[#A94424] font-semibold">{event.category}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate max-w-[160px]">{sourceName}</span>
          <span aria-hidden="true">·</span>
          <span>{dateLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-[#231B15]">{event.impactScore} IMP</span>
        </div>

        <h4 className="font-serif font-bold text-sm sm:text-base text-[#231B15] leading-snug line-clamp-2 group-hover:text-[#8B3218] transition-colors">
          {event.headline}
        </h4>

        {event.summary && (
          <p className="hidden sm:block text-xs text-[#6E6256] mt-1 line-clamp-1">
            {event.summary}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {onSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave(e);
            }}
            aria-label={isSaved ? 'Remove from archives' : 'Save to archives'}
            className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-colors ${
              isSaved ? 'text-[#A94424]' : 'text-[#9B8E80] hover:text-[#231B15]'
            }`}
          >
            <IconBookmark className="w-4 h-4" />
          </button>
        )}
        <div className="w-8 h-8 flex items-center justify-center text-[#9B8E80] group-hover:text-[#A94424] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
