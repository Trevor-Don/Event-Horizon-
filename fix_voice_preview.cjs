const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const previewEndpoint = `
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
`;
if (!code.includes('/api/voice-preview')) {
    code = code.replace(/app\.post\('\/api\/tts'/g, previewEndpoint.trim() + '\n\napp.post(\'/api/tts\'');
}

fs.writeFileSync('server.ts', code);
console.log("Fixed voice preview");
