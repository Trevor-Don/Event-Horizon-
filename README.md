<div align="center">

<!-- Stylized Header -->
<br />
<p>
  <img src="https://img.shields.io/badge/EVENT_HORIZON-DAILY_INTELLIGENCE_DISPATCH-A94424?style=for-the-badge&labelColor=231B15" alt="Event Horizon" />
</p>

<h1>Event Horizon</h1>

<p>
  <strong>A vintage editorial &amp; structured knowledge news system optimizing for relevance per unit time.</strong>
</p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-AI_Engine-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini 2.5 Flash" />
  <img src="https://img.shields.io/badge/ElevenLabs-Voice_TTS-231B15?style=flat-square" alt="ElevenLabs TTS" />
  <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase" />
</p>

<p>
  <a href="#what-is-event-horizon">Overview</a> •
  <a href="#core-capabilities">Capabilities</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#responsive-editorial-ui">Editorial UI</a> •
  <a href="#api-endpoints">API Reference</a> •
  <a href="#getting-started">Getting Started</a>
</p>

</div>

---

## What is Event Horizon?

**Event Horizon** is a full-stack intelligence news platform designed in a **Vintage Editorial Broadsheet** aesthetic to turn raw, fragmented news streams into structured, high-signal dispatches. Instead of forcing readers through endless chronological feeds, Event Horizon aggregates live RSS feeds, adapts to your geographic and domain priorities, and transforms articles into:

1. **Investigative Intelligence Reports** grounded with Google Search context inside a drop-cap dispatch reader.
2. **Local Vintage Print Photography** processed directly in the browser on HTML5 `<canvas>` from real RSS/OpenGraph article imagery (without relying on generative AI to remake every photo).
3. **Interactive 2D Knowledge Graphs** mapping people, organizations, locations, and concepts.
4. **Synthesized Audio Briefings ("Eve AI")** tailored to a user-selected time budget.
5. **Offline-Ready Saved Briefs ("The Archives")** synced across devices via Firebase Firestore and exportable as Markdown.

---

## Core Capabilities

| Capability | Description | Implementation |
| :--- | :--- | :--- |
| **Geo-Scoped News Projections** | Automatically detects browser coordinates (with permission) and reverse-geocodes via OpenStreetMap Nominatim to localize stories, or switches cleanly between **Global**, **National**, and **Custom RSS** feeds. | `App.tsx`, `POST /api/news` |
| **Local Vintage Image Processor** | Extracts real article photos from RSS media tags or OpenGraph metadata (`/api/resolve-image`, `/api/image-proxy`) and applies a 100% client-side `<canvas>` sepia tone-map, press contrast curve, radial vignette, and newsprint grain—falling back to curated archival plates when offline or unavailable. | `utils/localImageProcessor.ts`, `components/EditorialImage.tsx` |
| **Special Dispatch Reader** | Compiles 4–6+ paragraph investigative analyses covering the core event, historical background, and broader implications, featuring a classic editorial drop cap, scroll-linked right-margin reading ruler, citation links, Markdown export, and one-click narration. | `components/ArticleReader.tsx`, `POST /api/report` |
| **Eve AI Audio Briefings** | Generates a cohesive narrative briefing script sized to a **1–5 minute time budget** (~150 words/min) and renders speech using ElevenLabs neural voices (`Adam`, `Rachel`, `Clyde`, `Fin`, `Sarah`, `Charlie`, `George`) with live voice previews. | `components/AudioPlayer.tsx`, `POST /api/audio` |
| **2D Entity Knowledge Graph** | Extracts `Person`, `Organization`, `Location`, and `Concept` entities and directed relationships from filtered events, rendered on an interactive force-directed canvas alongside sentiment scoring (`0–100`). | `components/KnowledgeGraphView.tsx`, `POST /api/extract-knowledge` |
| **The Archives & Offline Sync** | Tactile clipping cards with category filters, multi-tab Firestore offline caching (`persistentLocalCache`), and Google Sign-In synchronization. | `components/SavedEventsList.tsx`, `firebase.ts` |
| **Adaptive Read-Time Weighting** | Tracks engagement duration in the Dispatch Reader (`> 5s`) and incrementally boosts affinity weights for that category in `localStorage` and Firestore. | `App.tsx`, `ArticleReader.tsx` |
| **Cookie Policy & Colophon** | Transparent Cookie & Local Storage Policy modal, dismissible essential-storage notice, and broadsheet footer featuring the **Trevon Creates** citation. | `components/CookiePolicyModal.tsx`, `components/EditorialFooter.tsx` |

---

## Responsive Editorial UI

Event Horizon adapts its broadsheet layout intentionally across device classes using an archival newsprint palette (`#F4EFE6` paper, `#FAF7F1` elevated cards, `#231B15` espresso ink, `#A94424` burnt sienna) paired with **Lora**, **Plus Jakarta Sans**, and **JetBrains Mono**:

- **Mobile (`< 768px`)**: Clean single-row masthead with inline search and a 5-tab bottom navigation bar (`Front`, `World`, `Eve AI`, `Saved`, `Account`)—eliminating duplicate header icons and drawer clutter.
- **Tablet (`768px – 1023px`)**: Replaces the side panel with a sleek, single-line horizontal editorial top navigation bar (`Front Page`, `World Wire`, `Graph`, `Eve AI`, `Archives`, `Account`) plus search.
- **Desktop (`>= 1024px`)**: Collapsible left archival navigation rail paired with a 12-column broadsheet Front Page grid (Lead Story + Secondary Columns + High-Impact Wire sidebar).
- **Favicons & Web Manifest**: Includes `public/apple-touch-icon.png` (`180x180`), `favicon-32x32.png`, `favicon-16x16.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, and `public/site.webmanifest` linked in `index.html`.

---

## How It Works

### 1. News Ingestion & Image Extraction (`POST /api/news`)
1. On startup, `App.tsx` checks `navigator.geolocation`. If granted, it reverse-geocodes coordinates using OpenStreetMap Nominatim to set `scope: 'National'` and `country`; otherwise it defaults to Global (`scope: 'World'`).
2. `POST /api/news` checks a **15-minute in-memory cache** (`newsCache`), then parses Google News RSS or a user-supplied `rssUrl` via `rss-parser`.
3. Up to 10 items are normalized into `NewsEvent` objects, extracting raw summary text (`content:encoded`, `full-text`, `description`) and any embedded RSS image URLs (`media:content`, `media:thumbnail`, `enclosure`, or HTML `<img>` tags via `cheerio`).

### 2. Local Canvas Vintage Print Pipeline (`localImageProcessor.ts`)
1. When an event card or dispatch reader mounts, `EditorialImage` checks `event.imageUrl` or lazily resolves `og:image` / `twitter:image` via SSRF-guarded `GET /api/resolve-image`.
2. Reachable images are streamed through `GET /api/image-proxy` (blocking private/loopback IP ranges and non-image responses) so HTML5 `<canvas>` can process pixels locally without CORS taint.
3. `applyLocalVintagePrintEffect` applies warm sepia tone-mapping, subtle press contrast, radial vignette, and deterministic newsprint grain completely locally in the browser, caching processed data URLs in memory.

### 3. AI Analysis & Multi-Provider Resilience (`callAIWithFallback`)
All generative text endpoints (`POST /api/report`, `POST /api/audio`, `POST /api/extract-knowledge`) route through `callAIWithFallback` in `server.ts`:
- **Primary Model**: Google **Gemini 2.5 Flash** (`@google/genai`), with **Google Search grounding** (`googleSearch: {}`) for investigative reports and **JSON response mode** (`application/json`) for knowledge graphs.
- **Fallback Model**: If the Gemini call fails and `OPENROUTER_API_KEY` is configured, the server transparently falls back to OpenRouter (`openai/gpt-4o-mini`).
- **Report Caching**: Compiled reports are cached in memory (`reportCache`) for **60 minutes** (`CACHE_TTL_MS * 4`).

### 4. Neural Audio & TTS Fallback (`generateElevenLabsAudio`)
For multi-story briefings (`/api/audio`), voice previews (`/api/voice-preview`), and single-article playback (`/api/tts`):
- **Primary Voice Engine**: ElevenLabs (`eleven_multilingual_v2`) streams `audio/mpeg` buffers using selected voice IDs.
- **Automatic Fallback**: If `ELEVENLABS_API_KEY` fails or rejects a request, the server automatically splits text into 200-character chunks and synthesizes fallback audio via `google-tts-api`.

### 5. Authentication, Cloud Sync & Offline Cache (`firebase.ts` & `firestore.rules`)
- **Authentication**: Users sign in with Google via Firebase Auth (`signInWithPopup`).
- **Data Model** (`firebase-blueprint.json`):
  - `users/{userId}` — Stores `preferences` (category affinity weights).
  - `users/{userId}/savedEvents/{eventId}` — Stores bookmarked `NewsEvent` documents.
- **Security Rules** (`firestore.rules`): Default-deny at root; enforces `request.auth.uid == userId`, verified email (`email_verified == true`), ID regex validation, and strict field type/length checks.
- **Offline Support**: `firebase.ts` initializes Firestore with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`, keeping saved briefs readable across tabs without an active internet connection.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19 + Vite)                         │
│                                                                         │
│  App.tsx ──┬── EventCard / EventListRow  (Front Page & World Wire)      │
│            ├── EditorialImage            (Local Canvas Vintage Filter)  │
│            ├── ArticleReader             (Drop Cap, Ruler, TTS, .md)    │
│            ├── KnowledgeGraphView        (ForceGraph2D + Sentiment)     │
│            ├── AudioPlayer               (Eve AI 1-5m Briefing Engine)  │
│            ├── SavedEventsList           (The Archives + Offline Cache) │
│            └── EditorialFooter + CookiePolicyModal                      │
│                     │                                │                  │
│                     ▼                                ▼                  │
│          services/geminiService.ts              firebase.ts             │
│          (REST API Client)              (Auth + Persistent Firestore)   │
└─────────────────────┼────────────────────────────────┼──────────────────┘
                      │                                │
                      ▼                                ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────┐
│        EXPRESS SERVER (server.ts)     │   │      FIREBASE CLOUD         │
│        Port 3000 • Vite / Dist        │   │  • Google Sign-In Auth      │
│                                       │   │  • Firestore DB + Rules     │
│  • /api/news              (rss-parser)│   └─────────────────────────────┘
│  • /api/resolve-image     (cheerio)   │
│  • /api/image-proxy       (SSRF-safe) │
│  • /api/report            (AI + Cache)│
│  • /api/audio             (Script+TTS)│
│  • /api/extract-knowledge (JSON Graph)│
│  • /api/tts & /api/voice-preview      │
└───────┬───────────────┬───────────────┘
        │               │
        ▼               ▼
┌──────────────┐ ┌─────────────────────────────────────────┐
│  Data Feeds  │ │          AI & Speech Providers          │
│ • Google RSS │ │ • Google Gemini 2.5 Flash (+ Search)    │
│ • Custom RSS │ │ • OpenRouter (openai/gpt-4o-mini)       │
│ • Nominatim  │ │ • ElevenLabs (eleven_multilingual_v2)   │
│   Geocoding  │ │ • Google TTS API (Chunked Fallback)     │
└──────────────┘ └─────────────────────────────────────────┘
```

---

## API Endpoints

All backend endpoints are defined in `server.ts`:

| Endpoint | Method | Input | Response | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/api/news` | `POST` | `{ settings, latitude, longitude }` | `NewsEvent[]` | Fetches and normalizes RSS items with 15-min caching, image extraction, and Nominatim reverse geocoding. |
| `/api/resolve-image` | `GET` | `?url=<articleUrl>` | `{ imageUrl: string \| null }` | SSRF-guarded OpenGraph / Twitter card image extractor (60-min cache). |
| `/api/image-proxy` | `GET` | `?url=<imageUrl>` | `image/*` binary | Streams public article images safely so the browser can apply local Canvas effects without CORS taint. |
| `/api/report` | `POST` | `{ event }` | `{ report: string }` | Generates a multi-paragraph investigative report with Google Search grounding (60-min cache). |
| `/api/audio` | `POST` | `{ events, minutes, voiceName }` | `audio/mpeg` binary | Synthesizes a narrative briefing script (`~minutes * 150` words) and renders speech audio. |
| `/api/extract-knowledge` | `POST` | `{ articles }` | `{ summary, sentimentScore, nodes, edges }` | Extracts typed entities and relationships as structured JSON for the 2D graph. |
| `/api/voice-preview` | `POST` | `{ voiceName }` | `audio/mpeg` binary | Plays a short voice sample for the selected presenter ID. |
| `/api/tts` | `POST` | `{ text, voiceName }` | `audio/mpeg` binary | Strips markdown symbols and converts article report text into speech. |

---

## Project Structure

```text
event-horizon/
├── App.tsx                       # Responsive shell (mobile bottom bar, tablet navbar, collapsible desktop rail)
├── server.ts                     # Express server, Vite middleware, RSS ingestion, image proxy, AI & TTS pipelines
├── types.ts                      # Core TypeScript interfaces (NewsEvent, ProjectionSettings, ViewMode)
├── firebase.ts                   # Firebase initialization, Google Auth provider, offline Firestore cache
├── firestore.rules               # Hardened Firestore security rules (UID ownership & schema validation)
├── firebase-blueprint.json       # Firestore entity schema definitions (User, SavedEvent)
├── firebase-applet-config.json   # Firebase project & Firestore database configuration
├── index.html                    # Fonts, archival theme tokens, favicons & web manifest links
├── public/                       # Favicons (apple-touch-icon, 16x16, 32x32, android-chrome) & site.webmanifest
├── utils/
│   ├── editorialMedia.ts         # Archival fallback artwork & editorial date/source formatters
│   └── localImageProcessor.ts    # Client-side HTML5 Canvas vintage broadsheet image processor
├── services/
│   └── geminiService.ts          # Frontend API client for /api/* routes
└── components/
    ├── ArticleReader.tsx         # Special Dispatch reader with drop cap, margin progress ruler, TTS & .md export
    ├── AudioPlayer.tsx           # Eve AI Briefing configurator, voice selector, waveform player
    ├── CookiePolicyModal.tsx     # Transparent Cookie & Local Storage Policy modal
    ├── EditorialFooter.tsx       # Professional broadsheet footer with "Created by Trevon Creates" citation
    ├── EditorialImage.tsx        # Image wrapper combining real-photo resolution + local Canvas filtering
    ├── EventCard.tsx             # Lead story & secondary editorial cards
    ├── EventListRow.tsx          # Broadsheet wire list rows
    ├── KnowledgeGraphView.tsx    # Interactive ForceGraph2D canvas, entity filters & sentiment metrics
    ├── SavedEventsList.tsx       # "The Archives" clipping board with category filters & Add Clipping card
    └── Icons.tsx                 # Custom SVG icon components
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ or v22 recommended)
- **npm**
- API keys (depending on which AI/voice capabilities you want active)
- A configured Firebase project (if using cloud auth/sync via `firebase-applet-config.json`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or `.env.local`) and populate your keys:

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENROUTER_API_KEY=your_openrouter_fallback_key   # Optional fallback if Gemini fails
```

> **Security Note:** Never commit `.env` files or expose API keys to client-side code. All AI, RSS, and image proxy calls execute exclusively inside `server.ts`.

### 3. Run in Development
Starts the unified Express + Vite middleware server on **port 3000**:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build & Run for Production
Bundles the React SPA into `dist/` and compiles `server.ts` into `dist/server.cjs`:
```bash
npm run build
npm start
```

---

<div align="center">
  <sub>Created by <strong>Trevon Creates</strong></sub>
</div>
