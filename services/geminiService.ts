import { NewsEvent, ProjectionSettings, Source } from '../types';

export const fetchNewsProjection = async (settings: ProjectionSettings, latitude?: number, longitude?: number): Promise<NewsEvent[]> => {
  try {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, latitude, longitude })
    });
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("News fetch failed", error);
    return [{
      id: "mock-1",
      headline: "Gemini API Connection Failed",
      summary: "Unable to retrieve live projections. Please check your API key or connection.",
      impactScore: 0,
      truthScore: 100,
      biasAnalysis: "System generated message.",
      timeSensitivity: "Background",
      category: "Technology",
      location: "System",
      sources: [],
      timestamp: new Date().toISOString(),
      reasoning: "System alert."
    }];
  }
};

export const generateBriefingAudio = async (events: NewsEvent[], minutes: number, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const res = await fetch('/api/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, minutes, voiceName })
    });
    if (!res.ok) throw new Error('API request failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
      console.error("Audio generation failed", error);
      return null;
  }
};

export const previewVoice = async (voiceName: string): Promise<string | null> => {
    try {
        const res = await fetch('/api/voice-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voiceName })
        });
        if (!res.ok) throw new Error('API request failed');
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Voice preview failed", error);
        return null;
    }
}

export const generateEventIllustration = async (event: NewsEvent): Promise<string | null> => {
    try {
        const res = await fetch('/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event })
        });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        return data.image || null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

export const generateDetailedReport = async (event: NewsEvent): Promise<string> => {
    try {
        const res = await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event })
        });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        return data.report || "Report generation failed.";
    } catch (e) {
        return "System unable to compile detailed report at this time.";
    }
}


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
