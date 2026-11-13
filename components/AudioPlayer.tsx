import React, { useEffect, useRef, useState } from 'react';
import { IconPlay, IconPause, IconRefresh, IconHeadphones } from './Icons';
import { previewVoice } from '../services/geminiService';

interface AudioPlayerProps {
  audioSrc: string | null;
  isLoading: boolean;
  onGenerate: (settings: { country: string; domain: string; voice: string; minutes: number }) => void;
  minutes: number;
  setMinutes: (m: number) => void;
  countries: string[];
  domains: string[];
}

const VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', label: 'Deep & Authoritative' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', label: 'Calm & Professional' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', label: 'Seasoned Correspondent' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', label: 'Coastal Narrator' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', label: 'Reassuring & Clear' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', label: 'Crisp & Energetic' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', label: 'Warm Storyteller' },
];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioSrc,
  isLoading,
  onGenerate,
  minutes,
  setMinutes,
  countries,
  domains,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('General');
  const [selectedVoice, setSelectedVoice] = useState<string>('pNInz6obpgDQGcFmaJgB');
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handlePreviewVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingVoiceId === voiceId) {
      if (previewRef.current) {
        previewRef.current.pause();
        previewRef.current.currentTime = 0;
      }
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voiceId);
    const src = await previewVoice(voiceId);
    if (src) {
      setPreviewSrc(src);
    } else {
      setPreviewingVoiceId(null);
    }
  };

  const handleGenerateClick = () => {
    onGenerate({ country: selectedCountry, domain: selectedDomain, voice: selectedVoice, minutes });
  };

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [audioSrc]);

  useEffect(() => {
    if (previewSrc && previewRef.current) {
      previewRef.current.src = previewSrc;
      previewRef.current.play().catch(() => {});
      previewRef.current.onended = () => setPreviewingVoiceId(null);
    }
  }, [previewSrc]);

  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl p-5 sm:p-7 shadow-[0_2px_12px_-2px_rgba(35,27,21,0.06)]">
      <audio ref={previewRef} className="hidden" />

      <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-[#DFD6C7]">
        <div className="w-16 h-16 rounded-2xl bg-[#ECE5D8] border border-[#DFD6C7] flex items-center justify-center mb-3 text-[#A94424]">
          <IconHeadphones className="w-7 h-7" />
        </div>
        <h3 className="font-serif font-bold text-2xl text-[#231B15]">Eve AI Broadcast</h3>
        <p className="text-[11px] font-mono text-[#6E6256] uppercase tracking-[0.16em] mt-1">
          {isLoading ? 'Compiling Audio Script...' : audioSrc ? 'Playback Ready' : 'Configure Spoken Edition'}
        </p>
      </div>

      {!audioSrc && !isLoading && (
        <div className="space-y-6">
          {/* Geographic Scope */}
          <div className="space-y-2 relative z-20">
            <label className="text-[11px] font-mono text-[#6E6256] font-semibold uppercase tracking-[0.14em]">
              Geographic Scope
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className="w-full bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl px-4 py-3 text-left text-sm text-[#231B15] flex justify-between items-center hover:border-[#A94424] transition-colors min-h-[44px]"
              >
                <span className="truncate">{selectedCountry || 'Global (All Regions)'}</span>
                <svg
                  className={`w-4 h-4 text-[#6E6256] transition-transform ${isCountryOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCountryOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#FAF7F1] border border-[#DFD6C7] rounded-xl shadow-lg max-h-52 overflow-y-auto z-50 p-1.5">
                  <input
                    type="text"
                    placeholder="Search country..."
                    className="w-full bg-[#F4EFE6] border border-[#DFD6C7] text-xs px-3 py-2 rounded-lg mb-1.5 focus:outline-none focus:border-[#A94424] text-[#231B15]"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#ECE5D8] rounded-lg text-[#231B15]"
                    onClick={() => {
                      setSelectedCountry('');
                      setIsCountryOpen(false);
                    }}
                  >
                    Global (All Regions)
                  </button>
                  {filteredCountries.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#ECE5D8] rounded-lg flex justify-between items-center ${
                        selectedCountry === c ? 'bg-[#ECE5D8] text-[#A94424] font-semibold' : 'text-[#231B15]'
                      }`}
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryOpen(false);
                      }}
                    >
                      <span>{c}</span>
                      {selectedCountry === c && <span className="text-[10px] font-mono">Selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Domain Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-[#6E6256] font-semibold uppercase tracking-[0.14em]">
              Editorial Desk
            </label>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`text-xs px-3.5 py-2 rounded-lg border transition-colors min-h-[38px] whitespace-nowrap ${
                    selectedDomain === d
                      ? 'bg-[#A94424] text-[#FAF7F1] border-[#A94424] font-semibold'
                      : 'bg-[#F4EFE6] border-[#DFD6C7] text-[#5C5146] hover:border-[#A94424]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Presenter Voice */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-[#6E6256] font-semibold uppercase tracking-[0.14em]">
              Presenter Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedVoice(v.id);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#ECE5D8] border-[#A94424]'
                        : 'bg-[#F4EFE6] border-[#DFD6C7] hover:border-[#C5B9A5]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0 ${
                          isSelected ? 'bg-[#A94424] text-[#FAF7F1]' : 'bg-[#FAF7F1] border border-[#DFD6C7] text-[#231B15]'
                        }`}
                      >
                        {v.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#231B15] truncate">{v.name}</div>
                        <div className="text-[10px] text-[#6E6256] truncate">{v.label}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePreviewVoice(v.id, e)}
                      aria-label={`Preview ${v.name}`}
                      title="Preview Voice"
                      className={`min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-colors border shrink-0 ${
                        previewingVoiceId === v.id
                          ? 'bg-[#231B15] text-[#FAF7F1] border-[#231B15]'
                          : 'bg-[#FAF7F1] text-[#5C5146] border-[#DFD6C7] hover:border-[#A94424]'
                      }`}
                    >
                      {previewingVoiceId === v.id ? (
                        <div className="w-2 h-2 bg-[#FAF7F1] rounded-sm" />
                      ) : (
                        <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-mono text-[#6E6256] font-semibold uppercase tracking-[0.14em]">
                Time Budget
              </label>
              <span className="text-xs font-mono text-[#231B15] font-bold tabular-nums">{minutes} min</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#ECE5D8] rounded-lg appearance-none cursor-pointer accent-[#A94424]"
            />
            <div className="flex justify-between w-full text-[10px] text-[#6E6256] font-mono uppercase">
              <span>1 min · Brief</span>
              <span>5 min · Deep</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateClick}
            className="w-full py-3.5 px-6 bg-[#A94424] hover:bg-[#8B3218] text-[#FAF7F1] font-semibold text-sm rounded-xl transition-colors min-h-[48px]"
          >
            Compile Audio Briefing
          </button>
        </div>
      )}

      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-5 text-center">
          <div className="w-12 h-12 border-4 border-[#ECE5D8] border-t-[#A94424] rounded-full animate-spin" />
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-widest text-[#A94424] font-semibold">
              Synthesizing Broadcast
            </div>
            <p className="text-xs text-[#6E6256]">Aligning top events and rendering presenter audio...</p>
          </div>
        </div>
      )}

      {audioSrc && !isLoading && (
        <div className="space-y-6">
          <div className="bg-[#F4EFE6] border border-[#DFD6C7] rounded-2xl p-6 flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center gap-1 h-12 w-full overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#A94424] rounded-full transition-all duration-200"
                  style={{
                    height: isPlaying ? `${25 + ((i * 19) % 70)}%` : '22%',
                    opacity: isPlaying ? 0.9 : 0.35,
                  }}
                />
              ))}
            </div>

            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#6E6256] w-10 text-right tabular-nums">
                {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
              </span>
              <div className="flex-1 h-2 bg-[#DFD6C7] rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-[#A94424] transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#6E6256] w-10 tabular-nums">
                {audioRef.current && !Number.isNaN(audioRef.current.duration)
                  ? formatTime(audioRef.current.duration)
                  : '--:--'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setProgress(0);
                  onGenerate({
                    country: selectedCountry,
                    domain: selectedDomain,
                    voice: selectedVoice,
                    minutes,
                  });
                }}
                className="min-w-[44px] min-h-[44px] rounded-full border border-[#DFD6C7] bg-[#FAF7F1] flex items-center justify-center text-[#5C5146] hover:text-[#231B15] hover:border-[#A94424] transition-colors"
                title="Recompile Briefing"
                aria-label="Recompile Briefing"
              >
                <IconRefresh className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause briefing' : 'Play briefing'}
                className="w-16 h-16 bg-[#A94424] hover:bg-[#8B3218] text-[#FAF7F1] rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
              >
                {isPlaying ? <IconPause className="w-7 h-7" /> : <IconPlay className="w-7 h-7 ml-0.5" />}
              </button>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};
