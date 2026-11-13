const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const ttsFallback = `
const googleTTS = require('google-tts-api');

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
        const response = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
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
            console.error(\`ElevenLabs API returned \${response.status}\`);
            throw new Error(\`ElevenLabs API returned \${response.status}\`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e: any) {
        console.warn("Falling back to Google TTS API due to ElevenLabs error:", e.message);
        
        // Chunk text for googleTTS (max 200 chars per chunk)
        const chunks = text.match(/.{1,200}(\\s|$)/g) || [text];
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
`;

code = code.replace(/async function generateElevenLabsAudio\([\s\S]*?return Buffer\.from\(arrayBuffer\);\n}/, ttsFallback.trim());

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with TTS fallback");
