const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const ttsEndpoint = `
app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, voiceName } = req.body;
        if (!text) {
             res.status(400).json({ error: "Text is required" });
             return;
        }
        // Clean markdown characters
        const cleanText = text.replace(/[*#]/g, "");
        const audioBuffer = await generateElevenLabsAudio(cleanText, voiceName || 'Kore');
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("TTS failed:", error);
        res.status(500).json({ error: error.message || "Failed to generate TTS" });
    }
});
`;

if (!server.includes('/api/tts')) {
    server += '\n' + ttsEndpoint;
    fs.writeFileSync('server.ts', server);
    console.log("Added /api/tts successfully.");
} else {
    console.log("Already added.");
}
