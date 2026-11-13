async function run() {
    const key = process.env.ELEVENLABS_API_KEY;
    const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: "Test",
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            })
        });
        console.log("Status:", response.status);
    } catch (e) {
        console.error(e);
    }
}
run();
