const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newsLogic = `
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
        
        // If the user provided a custom RSS URL, use it directly as a raw source
        const feedUrl = settings.rssUrl || \`https://news.google.com/rss/search?q=\${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en\`;
        
        // Use rss-parser to serve as a reliable source of raw news data
        const customParser = new Parser({
            customFields: {
                item: ['content:encoded', 'description', 'full-text']
            }
        });
        
        const feed = await customParser.parseURL(feedUrl);
        
        const events = feed.items.slice(0, 10).map((item, index) => {
            let publisher = "Unknown Source";
            let headline = item.title || "No Title";
            const parts = headline.split(' - ');
            if (!settings.rssUrl && parts.length > 1) {
                publisher = parts.pop() || "Unknown Source";
                headline = parts.join(' - ');
            } else if (item.creator || item.source) {
                publisher = item.creator || item.source;
            } else if (feed.title) {
                publisher = feed.title;
            }

            // Extract the deepest available raw content to solve the shallow content issue
            const rawData = item['content:encoded'] || item['full-text'] || item.content || item.description || item.contentSnippet || "";
            const cleanSummary = rawData.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().substring(0, 1500);

            return {
                id: \`event-\${Date.now()}-\${index}\`,
                headline: headline.trim(),
                summary: cleanSummary.substring(0, 200) + "...",
                fullRawData: cleanSummary, // Pass the deep raw data for the AI to enrich
                category: settings.domain || "General",
                impactScore: 70 - index * 2,
                timeSensitivity: "Routine",
                truthScore: 85,
                biasAnalysis: "Aggregated from standard news sources.",
                location: locationContext,
                sources: [{ name: publisher.trim(), url: item.link }],
                timestamp: item.isoDate || item.pubDate || new Date().toISOString(),
                reasoning: \`Raw data sourced from \${publisher}\`,
                isClickbaitOrPropaganda: false,
                clickbaitWarning: ""
            };
        });
`;

// replace the part from `let queryParts = [];` to `clickbaitWarning: ""`
code = code.replace(/let queryParts = \[\];[\s\S]*?clickbaitWarning: ""\n\s*};\n\s*}\);/g, newsLogic.trim());

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with full RSS raw data extraction");
