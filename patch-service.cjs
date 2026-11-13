const fs = require('fs');
let service = fs.readFileSync('services/geminiService.ts', 'utf8');

const generateTTS = `
export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName })
    });
    if (!res.ok) throw new Error('API request failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
      console.error("TTS generation failed", error);
      return null;
  }
};
`;

if (!service.includes('generateTTS')) {
    service += '\n' + generateTTS;
    fs.writeFileSync('services/geminiService.ts', service);
    console.log("Added generateTTS successfully.");
} else {
    console.log("Already added.");
}
