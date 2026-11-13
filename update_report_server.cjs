const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldReportLogic = `        const prompt = \`
            Act as a senior geopolitical analyst and editor.
            Write a comprehensive, structured briefing based on this event.
            
            HEADLINE: \${event.headline}
            SUMMARY: \${event.summary}
            CONTEXT: \${event.reasoning}
            IMPACT SCORE: \${event.impactScore}
            TRUTH SCORE: \${event.truthScore}
            BIAS ANALYSIS: \${event.biasAnalysis}
            CATEGORY: \${event.category}
            SOURCES: \${event.sources.map((s: any) => s.name).join(', ')}
            
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
        });

        res.json({ report: response.text || "Report generation failed." });`;

const newReportLogic = `        const prompt = \`
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

code = code.replace(oldReportLogic, newReportLogic);
fs.writeFileSync('server.ts', code);
console.log("Updated server.ts for report generation citations");
