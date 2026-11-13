const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Add caches at the top
const cacheDeclarations = `
const newsCache = new Map<string, { timestamp: number, data: any }>();
const reportCache = new Map<string, { timestamp: number, data: string }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
`;

if (!code.includes('const newsCache')) {
    code = code.replace(`const parser = new Parser();`, `const parser = new Parser();\n${cacheDeclarations}`);
}

// Update /api/news
const oldNewsEndpointStart = `app.post('/api/news', async (req: Request, res: Response): Promise<void> => {
    try {
        const { settings, latitude, longitude } = req.body;`;

const newNewsEndpointStart = `app.post('/api/news', async (req: Request, res: Response): Promise<void> => {
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
`;

code = code.replace(oldNewsEndpointStart, newNewsEndpointStart);

const oldNewsEndpointEnd = `        res.json(events);
    } catch (error: any) {`;

const newNewsEndpointEnd = `        newsCache.set(cacheKey, { timestamp: Date.now(), data: events });
        res.json(events);
    } catch (error: any) {`;

code = code.replace(oldNewsEndpointEnd, newNewsEndpointEnd);

// Update /api/report
const oldReportStart = `app.post('/api/report', async (req: Request, res: Response): Promise<void> => {
    try {
        const { event } = req.body;
        const prompt = \`
            Act as a senior geopolitical analyst and editor.
            Write a comprehensive, structured briefing based on this event.
            
            HEADLINE: \${event.headline}
            SUMMARY: \${event.summary}
            CONTEXT: \${event.reasoning}
            SOURCES: \${JSON.stringify(event.sources)}
            
            INSTRUCTIONS FOR INTELLECTUAL PROPERTY AND CITATION (CRITICAL):
            - You MUST cite your sources to avoid intellectual property theft.
            - Whenever you use direct wording or specific facts from the sources, the text segment MUST be linked to the specific article.
            - Use inline markdown links for citations in the format: [Source Name](URL) right next to the fact or direct quote.
            - Example: "According to reports, the new legislation passed with a majority [Reuters](https://reuters.com/...)."
            - Use the provided SOURCES, and use the google_search tool to find the most accurate up-to-date information and source URLs.
            
            FORMATTING RULES:
            - Use Markdown.
            - Start with an executive summary in bold.
            - Section 1: The Event (Detailed breakdown of what happened).
            - Section 2: Strategic Context (Why this matters, historical background).
            - Section 3: Implications (Future outlook, impact on sector/region).
            - Tone: Objective, high-density, professional.
            - No filler.
        \`;
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        res.json({ report: response.text || "Report generation failed." });`;

const newReportLogic = `app.post('/api/report', async (req: Request, res: Response): Promise<void> => {
    try {
        const { event } = req.body;
        const cacheKey = event.id || event.headline;

        if (reportCache.has(cacheKey)) {
            const cached = reportCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS * 4) { // 1 hour cache for reports
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
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        const reportText = response.text || "Report generation failed.";
        reportCache.set(cacheKey, { timestamp: Date.now(), data: reportText });
        res.json({ report: reportText });`;

code = code.replace(oldReportStart, newReportLogic);

fs.writeFileSync('server.ts', code);
console.log("Applied caching and simplified prompts to server.ts");
