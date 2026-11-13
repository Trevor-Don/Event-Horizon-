export interface Source {
  name: string;
  url: string;
}

export interface NewsEvent {
  id: string;
  headline: string;
  summary: string;
  fullRawData?: string;
  imageUrl?: string;
  impactScore: number; // 0 to 100
  timeSensitivity: 'Critical' | 'Urgent' | 'Routine' | 'Background';
  category: 'Geopolitics' | 'Technology' | 'Economy' | 'Science' | 'Culture' | 'Environment' | 'Sports' | 'Entertainment' | 'Health' | 'General';
  location: string;
  sources: Source[];
  timestamp: string;
  reasoning: string; // Why is this relevant?
  truthScore?: number;
  biasAnalysis?: string;
  isClickbaitOrPropaganda?: boolean;
  clickbaitWarning?: string;
  readTimeMs?: number;
}

export interface ProjectionSettings {
  scope: 'World' | 'National' | 'Local';
  country?: string; // Specific country for National scope
  domain: string; // "All" or specific category
  timeBudget: number; // Minutes
  searchQuery?: string;
  rssUrl?: string;
  userPreferences?: Record<string, number>;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  AUDIO = 'AUDIO',
  DETAIL = 'DETAIL',
  COMPARISON = 'COMPARISON',
  SAVED = 'SAVED'
}
