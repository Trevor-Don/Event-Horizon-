const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = `            You are a real-time news projection engine.
            OBJECTIVE: Search Google for the absolute latest, most critical news events happening RIGHT NOW.
            
            PARAMETERS:
            - Scope: \${locationContext}
            - Domain Focus: \${settings.domain}
            - Current Time: \${new Date().toISOString()}
            INSTRUCTIONS:
            1. Use the google_search tool to scan for breaking news, trending stories, and high-impact events.
            2. Filter results to find the top 6-8 most significant distinct events.
            3. Exclude opinion pieces, minor rumors, or outdated stories (older than 24h unless ongoing critical significance).
            4. For each event, identify its primary publisher/source (e.g., "Reuters", "AP", "The Verge").
            
            OUTPUT:
            Return a JSON array of objects strictly adhering to the schema.
            Ensure "summary" is dense and factual.
            Ensure "reasoning" explains why this event was prioritized.
            Ensure "truthScore" (0-100) reflects the factual legitimacy based on multiple sources.
            Ensure "biasAnalysis" provides a short analysis of potential bias in reporting.`;

const newPrompt = `            You are a real-time news projection engine.
            OBJECTIVE: Search Google for the absolute latest news events happening RIGHT NOW based on the user's parameters.
            
            PARAMETERS:
            - Scope: \${locationContext}
            - Domain Focus: \${settings.domain}
            - Custom Search Query: \${settings.searchQuery || 'None (General Trending)'}
            - Category Preferences (Weights): \${settings.userPreferences ? JSON.stringify(settings.userPreferences) : 'None'}
            - Current Time: \${new Date().toISOString()}
            
            INSTRUCTIONS:
            1. Use the google_search tool to scan for breaking news, trending stories, and high-impact events. If Custom Search Query is provided, prioritize searching for that specific topic.
            2. Filter results to find the top 6-8 most significant distinct events. Use Category Preferences to prioritize certain categories if provided. Include all types of news (Sports, Tech, major genres).
            3. If a Custom Search Query is provided and the topic is likely clickbait or propaganda, still include it but set "isClickbaitOrPropaganda" to true and explain why in "clickbaitWarning".
            4. In general, avoid bringing jargon or clickbait news unless explicitly searched for (as handled in step 3).
            5. For each event, identify its primary publisher/source (e.g., "Reuters", "AP", "The Verge").
            
            OUTPUT:
            Return a JSON array of objects strictly adhering to the schema.
            Ensure "summary" is dense and factual.
            Ensure "reasoning" explains why this event was prioritized.
            Ensure "truthScore" (0-100) reflects the factual legitimacy based on multiple sources.
            Ensure "biasAnalysis" provides a short analysis of potential bias in reporting.
            Ensure "isClickbaitOrPropaganda" (boolean) and "clickbaitWarning" (string) are provided if applicable.`;

code = code.replace(oldPrompt, newPrompt);

// Also need to add isClickbaitOrPropaganda and clickbaitWarning mapping in the server.ts response parsing

const oldMapping = `            truthScore: e.truthScore || 50,
            biasAnalysis: e.biasAnalysis || "Pending analysis.",
            location: e.location || "Global"`;
            
const newMapping = `            truthScore: e.truthScore || 50,
            biasAnalysis: e.biasAnalysis || "Pending analysis.",
            location: e.location || "Global",
            isClickbaitOrPropaganda: !!e.isClickbaitOrPropaganda,
            clickbaitWarning: e.clickbaitWarning || ""`;

code = code.replace(oldMapping, newMapping);

fs.writeFileSync('server.ts', code);
console.log("Rewrote server.ts with new prompt logic");
