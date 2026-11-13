const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const regexAudio = /app\.post\('\/api\/audio', async \(req: Request, res: Response\): Promise<void> => \{[\s\S]*?\}\);/g;
const regexPreview = /app\.post\('\/api\/voice-preview', async \(req: Request, res: Response\): Promise<void> => \{[\s\S]*?\}\);/g;

const elevenLabsMap = `
const elevenLabsVoiceMap: Record<string, string> = {
    'Kore': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'Dylan': '2EiwWnXFnvU5JabPnv8n', // Clyde
    'Fenrir': 'CYw3kZ02Hs0563khs1Fj', // Dave
    'Zephyr': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'Charon': 'VR6AewLTigWG4xSOukaG', // Arnold
};

async function generateElevenLabsAudio(text: string, voiceName: string): Promise<Buffer> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        throw new Error("ELEVENLABS_API_KEY environment variable is missing.");
    }
    const voiceId = elevenLabsVoiceMap[voiceName] || '21m00Tcm4TlvDq8ikWAM';
    
    const response = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        })
    });
    
    if (!response.ok) {
        const err = await response.text();
        throw new Error(\`ElevenLabs API error: \${response.statusText} - \${err}\`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
`;

const newAudio = `app.post('/api/audio', async (req: Request, res: Response): Promise<void> => {
    try {
        const { events, minutes, voiceName } = req.body;
        const model = 'gemini-2.5-flash';
        
        const eventCount = Math.max(1, Math.min(events.length, minutes * 2));
        const selectedEvents = events.slice(0, eventCount);

        let styleInstruction = "Tone: Professional, calm, concise, dense. Like a high-level intelligence briefing.";
        let introInstruction = "Start directly with the content. No 'Hello' or 'Welcome'.";

        if (voiceName === 'Dylan') {
            styleInstruction = "Tone: Extremely fast-paced, high energy, viral TikTok news style. Engaging, punchy, and rapid-fire.";
            introInstruction = "Start with a quick hook like 'News Daddy here catching you up' or similar. Cover the stories rapidly.";
        }

        const scriptPrompt = \`
            Create a script for an audio news briefing to be read by a text-to-speech engine.
            Target Duration: \${minutes} minutes.
            \${styleInstruction}
            
            Events to cover:
            \${selectedEvents.map((e: any) => \`- [\${e.timeSensitivity}] \${e.headline}: \${e.summary} (\${e.reasoning})\`).join('\\n')}
            
            Instructions:
            Synthesize these into a seamless narrative script. Do not just read the list. Connect related threads.
            \${introInstruction}
            CRITICAL: Output ONLY the spoken text script. No markdown formatting, no stage directions, no asterisks, no speaker labels. Just pure text to be spoken.
        \`;

        // 1. Generate text script with Gemini
        const textResponse = await getAi().models.generateContent({
            model,
            contents: [{ parts: [{ text: scriptPrompt }] }]
        });
        const scriptText = textResponse.text;
        
        if (!scriptText) {
             throw new Error("No script generated.");
        }

        // 2. Synthesize audio with ElevenLabs
        const audioBuffer = await generateElevenLabsAudio(scriptText, voiceName);
        
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("Audio generation failed:", error);
        res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
});`;

const newPreview = `app.post('/api/voice-preview', async (req: Request, res: Response): Promise<void> => {
    try {
        const { voiceName } = req.body;
        
        let text = \`Voice projection active. This is the \${voiceName} system profile.\`;

        if (voiceName === 'Dylan') {
            text = "News Daddy reporting. Catching you up on the world in seconds.";
        }

        const audioBuffer = await generateElevenLabsAudio(text, voiceName);
        
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error("Voice preview failed:", error);
        res.status(500).json({ error: error.message || "Failed to generate voice preview" });
    }
});`;

server = server.replace(regexAudio, elevenLabsMap + "\n\n" + newAudio);
server = server.replace(regexPreview, newPreview);

fs.writeFileSync('server.ts', server);
console.log("Patched server.ts successfully.");
