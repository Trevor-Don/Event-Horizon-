import React, { useEffect, useState } from 'react';
import { NewsEvent } from '../types';
import { getEditorialImage } from '../utils/editorialMedia';
import { getProcessedEditorialImage } from '../utils/localImageProcessor';

interface EditorialImageProps {
  event: NewsEvent;
  index?: number;
  alt: string;
  className?: string;
}

export const EditorialImage: React.FC<EditorialImageProps> = ({
  event,
  index = 0,
  alt,
  className = '',
}) => {
  const fallbackSrc = getEditorialImage(event, index);
  const [src, setSrc] = useState<string>(fallbackSrc);
  const [isProcessed, setIsProcessed] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImgError(false);
    setIsProcessed(false);
    setSrc(fallbackSrc);

    getProcessedEditorialImage(event, index).then((processed) => {
      if (!cancelled && processed) {
        setSrc(processed);
        setIsProcessed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [event, index, fallbackSrc]);

  if (imgError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ECE5D8] to-[#DFD6C7] text-[#6E6256] p-4 text-center">
        <span className="font-serif italic text-sm">Archival Dispatch Visual</span>
        <span className="font-mono text-[10px] uppercase tracking-widest mt-1">{event.category}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== fallbackSrc) {
          setSrc(fallbackSrc);
          setIsProcessed(false);
        } else {
          setImgError(true);
        }
      }}
      className={`${className} ${isProcessed ? '' : 'sepia-[0.45] contrast-[1.06] brightness-[0.98]'}`}
    />
  );
};
