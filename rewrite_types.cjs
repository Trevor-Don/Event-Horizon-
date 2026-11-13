const fs = require('fs');

let code = `export interface Source {
  name: string;
  url: string;
}

export interface NewsEvent {
  id: string;
  headline: string;
  summary: string;
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
  userPreferences?: Record<string, number>;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  AUDIO = 'AUDIO',
  DETAIL = 'DETAIL',
  COMPARISON = 'COMPARISON',
  SAVED = 'SAVED'
}
`;

fs.writeFileSync('types.ts', code);
console.log("Rewrote types.ts");
