const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
app.post('/api/extract-knowledge', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles } = req.body;
        // articles is an array of objects with id, headline, summary
        
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
        
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt + "\\nCRITICAL: Return ONLY valid JSON, do not wrap in markdown.",
            config: {
                 responseMimeType: "application/json",
            }
        });
        
        const rawData = response.text;
        if (!rawData) {
            res.json({ nodes: [], edges: [], summary: "", sentimentScore: 50 });
            return;
        }
        
        let graphData = JSON.parse(rawData);
        res.json(graphData);
    } catch (error: any) {
        console.error("Knowledge extraction failed:", error);
        res.status(500).json({ error: error.message });
    }
});
`;

if (!code.includes('/api/extract-knowledge')) {
    code = code.replace("app.listen(PORT", newEndpoint + "\\napp.listen(PORT");
    fs.writeFileSync('server.ts', code);
    console.log("Added /api/extract-knowledge to server.ts");
} else {
    console.log("Endpoint already exists");
}
