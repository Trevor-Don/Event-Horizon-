const fs = require('fs');

const code = `
import Parser from 'rss-parser';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function callAIWithFallback(prompt: string, options: { isJson?: boolean, useGoogleSearch?: boolean } = {}) {
    try {
        const config: any = {};
        if (options.isJson) {
            config.responseMimeType = "application/json";
        }
        if (options.useGoogleSearch) {
            config.tools = [{ googleSearch: {} }];
        }
        
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: Object.keys(config).length > 0 ? config : undefined
        });
        return response.text;
    } catch (error: any) {
        console.warn("Gemini API failed, falling back to OpenRouter:", error.message);
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            throw new Error("Gemini API failed and OPENROUTER_API_KEY is not set. Error: " + error.message);
        }
        
        const fallbackModel = "openai/gpt-4o-mini"; // Use a fast reliable model
        
        let messages = [
            { role: "user", content: prompt }
        ];

        let body: any = {
            model: fallbackModel,
            messages: messages,
        };

        if (options.isJson) {
            body.response_format = { type: "json_object" };
            if (!prompt.toLowerCase().includes("json")) {
                messages[0].content += "\\nReturn JSON output only.";
            }
        }

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": \`Bearer \${openRouterKey}\`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!orResponse.ok) {
            const errBody = await orResponse.text();
            throw new Error(\`OpenRouter API failed: \${orResponse.status} \${errBody}\`);
        }

        const orData = await orResponse.json();
        return orData.choices?.[0]?.message?.content || "";
    }
}

async function generateElevenLabsAudio(text: string, voiceName: string) {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
    const voiceMap: Record<string, string> = {
        'Rachel': '21m00Tcm4TlvDq8ikWAM',
        'Clyde': '2EiwWnXFnvU5JabPnv8n',
        'Fin': 'D38z5RcWu1voky8WS1ja',
        'Kore': 'Zza0Z5Qk1b702P4UoXQv'
    };
    const voiceId = voiceMap[voiceName] || voiceMap['Kore'];
    const response = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.5 }
        })
    });
    if (!response.ok) {
        throw new Error(\`ElevenLabs API returned \${response.status}\`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

const parser = new Parser();
const newsCache = new Map<string, { timestamp: number, data: any }>();
const reportCache = new Map<string, { timestamp: number, data: string }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const app = express();
const PORT = 3000;
app.use(express.json());

app.post('/api/news', async (req: Request, res: Response): Promise<void> => {
    try {
        const { settings, latitude, longitude } = req.body;
        const cacheKey = JSON.stringify({ settings, latitude, longitude });
        if (newsCache.has(cacheKey)) {
            const cached = newsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                res.json(cached.data);
                return;
            }
        }
        
        let queryParts = [];
        if (settings.searchQuery) { queryParts.push(settings.searchQuery); }
        if (settings.domain && settings.domain !== 'General' && settings.domain !== 'All') { queryParts.push(settings.domain); }

        let locationContext = "Global";
        if (settings.scope === 'Local' && latitude && longitude) {
            try {
                const geoRes = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${latitude}&lon=\${longitude}\`, {
                    headers: { 'User-Agent': 'EventHorizon/1.0' }
                });
                const geoData = await geoRes.json();
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || '';
                if (city) {
                    queryParts.push(city);
                    locationContext = \`Local (\${city})\`;
                } else { queryParts.push("Local News"); }
            } catch (e) { queryParts.push("Local News"); }
        } else if (settings.scope === 'National') {
            const country = settings.country || "US";
            queryParts.push(country);
            locationContext = \`National (\${country})\`;
        }

        if (queryParts.length === 0) { queryParts.push("Top News"); }

        const query = queryParts.join(' ');
        const feedUrl = \`https://news.google.com/rss/search?q=\${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en\`;
        const feed = await parser.parseURL(feedUrl);
        
        const events = feed.items.slice(0, 8).map((item, index) => {
            let publisher = "Unknown Source";
            let headline = item.title || "No Title";
            const parts = headline.split(' - ');
            if (parts.length > 1) {
                publisher = parts.pop() || "Unknown Source";
                headline = parts.join(' - ');
            } else if (item.creator || item.source) {
                publisher = item.creator || item.source;
            }

            return {
                id: \`event-\${Date.now()}-\${index}\`,
                headline: headline.trim(),
                summary: (item.contentSnippet || "").split('\\n')[0].substring(0, 150) + "...",
                category: settings.domain || "General",
                impactScore: 70 - index * 2,
                timeSensitivity: "Routine",
                truthScore: 85,
                biasAnalysis: "Aggregated from standard news sources.",
                location: locationContext,
                sources: [{ name: publisher.trim(), url: item.link }],
                timestamp: item.isoDate || new Date().toISOString(),
                reasoning: \`Trending in \${locationContext} matching query: \${query}\`,
                isClickbaitOrPropaganda: false,
                clickbaitWarning: ""
            };
        });

        newsCache.set(cacheKey, { timestamp: Date.now(), data: events });
        res.json(events);
    } catch (error: any) {
        console.error("RSS Fetch failed:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/report', async (req: Request, res: Response): Promise<void> => {
    try {
        const { event } = req.body;
        const cacheKey = event.id || event.headline;

        if (reportCache.has(cacheKey)) {
            const cached = reportCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS * 4) {
                res.json({ report: cached.data });
                return;
            }
        }

        const prompt = \`
            Act as a news summarizer.
            Your task is to concisely summarize the available information for this event using existing web content. Do NOT generate new analytical narratives or long-winded speculation. Keep it brief and cost-efficient.
            
            HEADLINE: \${event.headline}
            SUMMARY: \${event.summary}
            CONTEXT: \${event.reasoning}
            SOURCES: \${JSON.stringify(event.sources)}
            
            INSTRUCTIONS FOR INTELLECTUAL PROPERTY AND CITATION:
            - You MUST cite your sources.
            - Whenever you use direct wording or specific facts from the sources, the text segment MUST be linked to the specific article.
            - Use inline markdown links for citations in the format: [Source Name](URL) right next to the fact or direct quote.
            - Use the provided SOURCES, and use the google_search tool to quickly find and summarize the most accurate up-to-date facts about the event.
            
            FORMATTING RULES:
            - Use Markdown.
            - Keep it under 3 short paragraphs to save processing time and tokens.
            - Tone: Objective and concise.
        \`;
        
        const reportText = await callAIWithFallback(prompt, { useGoogleSearch: true });
        reportCache.set(cacheKey, { timestamp: Date.now(), data: reportText || "Report generation failed." });
        res.json({ report: reportText || "Report generation failed." });
    } catch (error: any) {
        console.error("Report generation failed:", error);
        res.json({ report: "System unable to compile detailed report at this time due to API limits. Please try again later." });
    }
});

app.post('/api/audio', async (req: Request, res: Response): Promise<void> => {
    try {
        const { events, minutes, voiceName } = req.body;
        const eventCount = Math.max(1, Math.min(events.length, minutes * 2));
        const selectedEvents = events.slice(0, eventCount);
        
        let styleInstruction = "Tone: Professional, calm, concise, dense. Like a high-level intelligence briefing.";
        const scriptPrompt = \`
            You are generating the audio script for an automated news briefing.
            Target duration: Approx \${minutes} minutes (around \${minutes * 150} words).
            Events to cover:
            \${selectedEvents.map((e: any) => \`- [\${e.timeSensitivity}] \${e.headline}: \${e.summary} (\${e.reasoning})\`).join('\\n')}
            
            Instructions:
            Synthesize these into a seamless narrative script. Do not just read the list. Connect related threads.
            \${styleInstruction}
            CRITICAL: Output ONLY the spoken text script. No markdown formatting, no stage directions, no asterisks, no speaker labels. Just pure text to be spoken.
        \`;
        
        const scriptText = await callAIWithFallback(scriptPrompt);
        if (!scriptText) {
             throw new Error("No script generated.");
        }
        
        const audioBuffer = await generateElevenLabsAudio(scriptText, voiceName || 'Kore');
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("Audio generation failed:", error);
        res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
});

app.post('/api/extract-knowledge', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles } = req.body;
        const prompt = \`
            Analyze the following news articles and extract a knowledge graph.
            Identify entities (people, organizations, locations, concepts) and the relationships between them.
            Also, provide a brief overarching summary for these articles combined, and a general sentiment score (0-100, where 100 is highly positive, 0 is highly negative).
            
            Articles:
            \${JSON.stringify(articles)}
            
            Output strictly a valid JSON object with the following schema:
            {
                "summary": "Brief overall summary",
                "sentimentScore": 50,
                "nodes": [
                    { "id": "Entity Name", "label": "Entity Name", "type": "Person|Organization|Location|Concept" }
                ],
                "edges": [
                    { "source": "Entity1", "target": "Entity2", "label": "Relationship description" }
                ]
            }
        \`;
        
        const rawData = await callAIWithFallback(prompt + "\\nCRITICAL: Return ONLY valid JSON, do not wrap in markdown.", { isJson: true });
        if (!rawData) {
            res.json({ nodes: [], edges: [], summary: "Knowledge extraction failed", sentimentScore: 50 });
            return;
        }
        
        let graphData = JSON.parse(rawData);
        res.json(graphData);
    } catch (error: any) {
        console.error("Knowledge extraction failed:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, voiceName } = req.body;
        if (!text) {
             res.status(400).json({ error: "Text is required" });
             return;
        }
        const cleanText = text.replace(/[*#]/g, "");
        const audioBuffer = await generateElevenLabsAudio(cleanText, voiceName || 'Kore');
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("TTS failed:", error);
        res.status(500).json({ error: error.message || "Failed to generate TTS" });
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', code);
console.log("Restored server.ts completely with proper fallback logic");
