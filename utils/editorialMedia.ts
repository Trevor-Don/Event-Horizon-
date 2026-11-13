import leadWorldImg from '../src/assets/images/editorial_lead_world_1794594418601.jpg';
import techPressImg from '../src/assets/images/editorial_tech_press_1794594418618.jpg';
import scienceEtchingImg from '../src/assets/images/editorial_science_etching_1794594419845.jpg';
import geopoliticsAtlasImg from '../src/assets/images/editorial_geopolitics_atlas_1794594420568.jpg';
import economyLedgerImg from '../src/assets/images/editorial_economy_ledger_1794594418775.jpg';
import cultureSalonImg from '../src/assets/images/editorial_culture_salon_1794598493528.jpg';
import { NewsEvent } from '../types';

export const EDITORIAL_PLACEHOLDERS = [
  leadWorldImg,
  scienceEtchingImg,
  techPressImg,
  geopoliticsAtlasImg,
  economyLedgerImg,
  cultureSalonImg,
];

function hashHeadline(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getEditorialImage(event: NewsEvent, index = 0): string {
  if (event.imageUrl) return event.imageUrl;

  switch (event.category) {
    case 'Technology':
      return index % 2 === 0 ? techPressImg : leadWorldImg;
    case 'Culture':
    case 'Entertainment':
    case 'Sports':
      return index % 2 === 0 ? cultureSalonImg : techPressImg;
    case 'Science':
    case 'Environment':
    case 'Health':
      return index % 2 === 0 ? scienceEtchingImg : cultureSalonImg;
    case 'Geopolitics':
      return index % 2 === 0 ? geopoliticsAtlasImg : leadWorldImg;
    case 'Economy':
      return index % 2 === 0 ? economyLedgerImg : geopoliticsAtlasImg;
    default: {
      if (index === 0) return leadWorldImg;
      const seed = hashHeadline(event.headline || '') + index;
      return EDITORIAL_PLACEHOLDERS[seed % EDITORIAL_PLACEHOLDERS.length];
    }
  }
}

export function formatDispatchDate(timestamp?: string): string {
  if (!timestamp) return 'TODAY';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'TODAY';
  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

export function getPrimarySourceName(event: NewsEvent): string {
  const sourceName = event.sources?.[0]?.name?.trim();
  return sourceName && sourceName.length > 0 ? sourceName : 'Editorial Wire';
}

export function getEditionDateLabel(): string {
  return new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}
