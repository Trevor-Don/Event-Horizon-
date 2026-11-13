const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldReportStart = `app.post('/api/report'`;
const nextAppPost = `// Vite middleware`;

const startIndex = code.indexOf(oldReportStart);
const endIndex = code.indexOf(nextAppPost);

if (startIndex !== -1 && endIndex !== -1) {
    const oldBlock = code.substring(startIndex, endIndex);
    const newBlock = `app.post('/api/report', async (req: Request, res: Response): Promise<void> => {
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
        res.json({ report: response.text || "Report generation failed." });
    } catch (error: any) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("Report generation failed:", error);
        res.json({ report: "System unable to compile detailed report at this time due to API limits. Please try again later." });
    }
});

`;
    code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
    fs.writeFileSync('server.ts', code);
    console.log("Fixed /api/report api.");
} else {
    console.log("Could not find the block to replace.");
}

