
import Parser from 'rss-parser';
import express, { Request, Response } from 'express';
import path from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';
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
        console.log("Using OpenRouter.");
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
                messages[0].content += "\nReturn JSON output only.";
            }
        }

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!orResponse.ok) {
            const errBody = await orResponse.text();
            throw new Error(`OpenRouter API failed: ${orResponse.status} ${errBody}`);
        }

        const orData = await orResponse.json();
        return orData.choices?.[0]?.message?.content || "";
    }
}

import * as googleTTS from "google-tts-api";

async function generateElevenLabsAudio(text: string, voiceName: string) {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
    const voiceMap: Record<string, string> = {
        'Rachel': '21m00Tcm4TlvDq8ikWAM',
        'Clyde': '2EiwWnXFnvU5JabPnv8n',
        'Fin': 'D38z5RcWu1voky8WS1ja',
        'Kore': 'pNInz6obpgDQGcFmaJgB'
    };
    const voiceId = voiceMap[voiceName] || voiceName || "pNInz6obpgDQGcFmaJgB";
    
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            })
        });
        
        if (!response.ok) {
            console.error(`ElevenLabs API returned ${response.status}`);
            throw new Error(`ElevenLabs API returned ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e: any) {
        console.warn("Falling back to Google TTS API due to ElevenLabs error:", e.message);
        
        // Chunk text for googleTTS (max 200 chars per chunk)
        const chunks = text.match(/.{1,200}(\s|$)/g) || [text];
        const buffers = [];
        
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            try {
                const b64 = await googleTTS.getAudioBase64(chunk.trim(), {
                    lang: 'en',
                    slow: false,
                    host: 'https://translate.google.com',
                    timeout: 10000,
                });
                buffers.push(Buffer.from(b64, 'base64'));
            } catch (err: any) {
                console.error("Google TTS error:", err.message);
            }
        }
        
        if (buffers.length > 0) {
            return Buffer.concat(buffers);
        }
        throw e;
    }
}

const parser = new Parser();
const newsCache = new Map<string, { timestamp: number, data: any }>();
const reportCache = new Map<string, { timestamp: number, data: string }>();
const ogImageCache = new Map<string, { timestamp: number, imageUrl: string | null }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function isPublicHttpUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

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
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: { 'User-Agent': 'EventHorizon/1.0' }
                });
                const geoData = await geoRes.json();
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || '';
                if (city) {
                    queryParts.push(city);
                    locationContext = `Local (${city})`;
                } else { queryParts.push("Local News"); }
            } catch (e) { queryParts.push("Local News"); }
        } else if (settings.scope === 'National') {
            const country = settings.country || "US";
            queryParts.push(country);
            locationContext = `National (${country})`;
        }

        if (queryParts.length === 0) { queryParts.push("Top News"); }

        const query = queryParts.join(' ');
        
        // If the user provided a custom RSS URL, use it directly as a raw source
        const feedUrl = settings.rssUrl || `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        
        // Use rss-parser to serve as a reliable source of raw news data
        const customParser = new Parser({
            customFields: {
                item: ['content:encoded', 'description', 'full-text', 'media:content', 'media:thumbnail', 'media:group', 'source']
            }
        });
        
        const feed = await customParser.parseURL(feedUrl);
        
        const events = feed.items.slice(0, 10).map((item: any, index: number) => {
            let publisher = "Unknown Source";
            let headline = item.title || "No Title";
            const parts = headline.split(' - ');
            if (!settings.rssUrl && parts.length > 1) {
                publisher = parts.pop() || "Unknown Source";
                headline = parts.join(' - ');
            } else if (item.creator || item.source) {
                const src = typeof item.source === 'string' ? item.source : item.source?._ || item.source?.$?.url;
                publisher = item.creator || src || "Unknown Source";
            } else if (feed.title) {
                publisher = feed.title;
            }

            // Extract the deepest available raw content to solve the shallow content issue
            const rawData = item['content:encoded'] || item['full-text'] || item.content || item.description || item.contentSnippet || "";
            const cleanSummary = rawData.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1500);

            // Extract real image URL from RSS metadata or embedded HTML if available
            let imageUrl: string | undefined;
            const mediaGroup = item['media:group'];
            const mediaContent = item['media:content'] || mediaGroup?.['media:content'];
            const mediaThumb = item['media:thumbnail'] || mediaGroup?.['media:thumbnail'];
            if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
                imageUrl = mediaContent[0].$.url;
            } else if (mediaContent?.$?.url) {
                imageUrl = mediaContent.$.url;
            } else if (Array.isArray(mediaThumb) && mediaThumb[0]?.$?.url) {
                imageUrl = mediaThumb[0].$.url;
            } else if (mediaThumb?.$?.url) {
                imageUrl = mediaThumb.$.url;
            } else if (item.enclosure?.url && (!item.enclosure.type || String(item.enclosure.type).startsWith('image/'))) {
                imageUrl = item.enclosure.url;
            } else if (rawData) {
                const $ = cheerio.load(rawData);
                const firstImg = $('img').first().attr('src') || $('img').first().attr('data-src');
                if (firstImg && isPublicHttpUrl(firstImg)) {
                    imageUrl = firstImg;
                }
            }

            return {
                id: `event-${Date.now()}-${index}`,
                headline: headline.trim(),
                summary: cleanSummary.substring(0, 200) + "...",
                fullRawData: cleanSummary, // Pass the deep raw data for the AI to enrich
                imageUrl,
                category: settings.domain || "General",
                impactScore: 70 - index * 2,
                timeSensitivity: "Routine",
                truthScore: 85,
                biasAnalysis: "Aggregated from standard news sources.",
                location: locationContext,
                sources: [{ name: String(publisher).trim(), url: item.link }],
                timestamp: item.isoDate || item.pubDate || new Date().toISOString(),
                reasoning: `Raw data sourced from ${publisher}`,
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

                        const prompt = `
            Act as an expert investigative journalist and intelligence analyst.
            Your task is to provide a comprehensive, in-depth analysis of this news event. You must explore the context, key players, historical precedents, and potential future implications. Provide rich details and a nuanced perspective based on the information provided and your extensive knowledge base.
            
            HEADLINE: ${event.headline}
            SUMMARY: ${event.summary}
            RAW DATA: ${event.fullRawData || ""}
            CONTEXT: ${event.reasoning}
            SOURCES: ${JSON.stringify(event.sources)}
            
            INSTRUCTIONS:
            - You MUST write the report based on the provided HEADLINE and SUMMARY, supplementing it with your own historical and contextual knowledge about the topics and entities involved.
            - DO NOT mention that you cannot browse the internet, cannot access real-time sources, or are an AI. Act as the journalist.
            - Provide a detailed, in-depth report (at least 4-6 comprehensive paragraphs) covering:
              1. The Core Event: What exactly happened based on the summary?
              2. Key Context & Background: What led to this? Why is this happening now? (Use your knowledge base).
              3. Implications & Impact: What are the broader consequences (economic, political, social)?
            - Tone: Analytical, objective, deeply informative, and professional.
        `;
        
        const reportText = await callAIWithFallback(prompt, { useGoogleSearch: true });
        reportCache.set(cacheKey, { timestamp: Date.now(), data: reportText || "Report generation failed." });
        res.json({ report: reportText || "Report generation failed." });
    } catch (error: any) {
        console.log("Report generation gracefully failed.");
        res.json({ report: "System unable to compile detailed report at this time due to API limits. Please try again later." });
    }
});

app.post('/api/audio', async (req: Request, res: Response): Promise<void> => {
    try {
        const { events, minutes, voiceName } = req.body;
        const eventCount = Math.max(1, Math.min(events.length, minutes * 2));
        const selectedEvents = events.slice(0, eventCount);
        
        let styleInstruction = "Tone: Professional, calm, concise, dense. Like a high-level intelligence briefing.";
        const scriptPrompt = `
            You are generating the audio script for an automated news briefing.
            Target duration: Approx ${minutes} minutes (around ${minutes * 150} words).
            Events to cover:
            ${selectedEvents.map((e: any) => `- [${e.timeSensitivity}] ${e.headline}: ${e.summary} (${e.reasoning})`).join('\n')}
            
            Instructions:
            Synthesize these into a seamless narrative script. Do not just read the list. Connect related threads.
            ${styleInstruction}
            CRITICAL: Output ONLY the spoken text script. No markdown formatting, no stage directions, no asterisks, no speaker labels. Just pure text to be spoken.
        `;
        
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
        const prompt = `
            Analyze the following news articles and extract a knowledge graph.
            Identify entities (people, organizations, locations, concepts) and the relationships between them.
            Also, provide a brief overarching summary for these articles combined, and a general sentiment score (0-100, where 100 is highly positive, 0 is highly negative).
            
            Articles:
            ${JSON.stringify(articles)}
            
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
        `;
        
        const rawData = await callAIWithFallback(prompt + "\nCRITICAL: Return ONLY valid JSON, do not wrap in markdown.", { isJson: true });
        if (!rawData) {
            res.json({ nodes: [], edges: [], summary: "Knowledge extraction failed", sentimentScore: 50 });
            return;
        }
        
        let graphData = JSON.parse(rawData);
        res.json(graphData);
    } catch (error: any) {
        console.log("Knowledge extraction gracefully failed.");
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/image', async (req: Request, res: Response): Promise<void> => {
    res.json({ image: null });
});

app.get('/api/resolve-image', async (req: Request, res: Response): Promise<void> => {
    const rawUrl = String(req.query.url || '');
    const parsed = isPublicHttpUrl(rawUrl);
    if (!parsed) {
        res.json({ imageUrl: null });
        return;
    }

    const cached = ogImageCache.get(rawUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS * 4) {
        res.json({ imageUrl: cached.imageUrl });
        return;
    }

    const extractMetaImage = (html: string, baseUrl: string): string | null => {
        const $ = cheerio.load(html);
        const candidate =
            $('meta[property="og:image:secure_url"]').attr('content') ||
            $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image:src"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('link[rel="image_src"]').attr('href') ||
            '';

        if (candidate) {
            try {
                const abs = new URL(candidate, baseUrl).toString();
                if (isPublicHttpUrl(abs) && !abs.includes('googleusercontent.com/kp/') && !abs.includes('news.google.com')) {
                    return abs;
                }
            } catch {}
        }

        // Check JSON-LD schema.org image
        let ldImg: string | null = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            if (ldImg) return;
            try {
                const parsedJson = JSON.parse($(el).html() || '{}');
                const imgField = parsedJson?.image;
                const candidateLd = typeof imgField === 'string' ? imgField : Array.isArray(imgField) ? imgField[0] : imgField?.url;
                if (typeof candidateLd === 'string') {
                    const abs = new URL(candidateLd, baseUrl).toString();
                    if (isPublicHttpUrl(abs)) ldImg = abs;
                }
            } catch {}
        });
        return ldImg;
    };

    try {
        const reqHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+678'
        };

        const response = await axios.get(parsed.toString(), {
            timeout: 4500,
            maxRedirects: 5,
            headers: reqHeaders,
            maxContentLength: 2 * 1024 * 1024,
        });

        let finalUrl = response.request?.res?.responseUrl || parsed.toString();
        let html = typeof response.data === 'string' ? response.data : '';
        let resolved = extractMetaImage(html, finalUrl);

        // If Google News wrapper page exposed an external publisher link, follow one hop
        if (!resolved && finalUrl.includes('news.google.com')) {
            const $ = cheerio.load(html);
            const hopUrl =
                $('[data-n-au]').attr('data-n-au') ||
                $('a[href^="http"]').filter((_, el) => {
                    const href = $(el).attr('href') || '';
                    return !href.includes('google.com') && Boolean(isPublicHttpUrl(href));
                }).first().attr('href');

            if (hopUrl && isPublicHttpUrl(hopUrl)) {
                const hopRes = await axios.get(hopUrl, {
                    timeout: 4000,
                    maxRedirects: 4,
                    headers: reqHeaders,
                    maxContentLength: 2 * 1024 * 1024,
                });
                const hopFinalUrl = hopRes.request?.res?.responseUrl || hopUrl;
                const hopHtml = typeof hopRes.data === 'string' ? hopRes.data : '';
                resolved = extractMetaImage(hopHtml, hopFinalUrl);
            }
        }

        ogImageCache.set(rawUrl, { timestamp: Date.now(), imageUrl: resolved });
        res.json({ imageUrl: resolved });
    } catch {
        ogImageCache.set(rawUrl, { timestamp: Date.now(), imageUrl: null });
        res.json({ imageUrl: null });
    }
});

app.get('/api/image-proxy', async (req: Request, res: Response): Promise<void> => {
    const rawUrl = String(req.query.url || '');
    const parsed = isPublicHttpUrl(rawUrl);
    if (!parsed) {
        res.status(400).send('Invalid image URL');
        return;
    }

    try {
        const response = await axios.get(parsed.toString(), {
            responseType: 'arraybuffer',
            timeout: 5000,
            maxRedirects: 4,
            maxContentLength: 5 * 1024 * 1024,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EventHorizon/1.0)',
                'Accept': 'image/*'
            }
        });
        const contentType = String(response.headers['content-type'] || '');
        if (!contentType.startsWith('image/')) {
            res.status(415).send('Not an image');
            return;
        }
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(Buffer.from(response.data));
    } catch {
        res.status(502).send('Image fetch failed');
    }
});

app.post('/api/voice-preview', async (req: Request, res: Response): Promise<void> => {
    try {
        const { voiceName } = req.body;
        const text = "This is a preview of my voice.";
        const audioBuffer = await generateElevenLabsAudio(text, voiceName || 'Kore');
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("Preview failed:", error);
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
      server: { middlewareMode: true, hmr: false },
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
