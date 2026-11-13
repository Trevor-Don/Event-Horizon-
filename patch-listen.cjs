const fs = require('fs');
let reader = fs.readFileSync('components/ArticleReader.tsx', 'utf8');

const targetState = `  const [loading, setLoading] = useState(true);`;
const newState = `  const [loading, setLoading] = useState(true);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);`;

reader = reader.replace(targetState, newState);

const targetHandleListen = `  const handleListen = () => {
      if (!content) return;
      if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(content.replace(/[*#]/g, ""));
          window.speechSynthesis.speak(utterance);
      } else {
          alert("Text-to-speech is not supported in this browser.");
      }
  };`;

const newHandleListen = `  const handleListen = async () => {
      if (!content) return;
      
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              audioRef.current.play();
              setIsPlaying(true);
          }
          return;
      }
      
      setIsAudioLoading(true);
      const audioUrl = await generateTTS(content);
      setIsAudioLoading(false);
      
      if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.onended = () => setIsPlaying(false);
          audioRef.current = audio;
          audio.play();
          setIsPlaying(true);
      } else {
          alert("Failed to generate audio.");
      }
  };
  
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = "";
          }
      }
  }, []);
`;

reader = reader.replace(targetHandleListen, newHandleListen);

const targetButton = `<button 
        onClick={handleListen}
        className="flex items-center space-x-2 text-xs bg-theme-bg/50 hover:bg-theme-text hover:text-theme-bg border border-white/10 px-4 py-2 rounded-xl transition-all text-theme-muted"
    >
        <IconHeadphones className="w-4 h-4" />
        <span>Listen</span>
    </button>`;

const newButton = `<button 
        onClick={handleListen}
        className="flex items-center space-x-2 text-xs bg-theme-bg/50 hover:bg-theme-text hover:text-theme-bg border border-white/10 px-4 py-2 rounded-xl transition-all text-theme-muted"
    >
        {isAudioLoading ? (
            <div className="w-4 h-4 border-2 border-theme-bg border-t-transparent rounded-full animate-spin"></div>
        ) : (
            <IconHeadphones className="w-4 h-4" />
        )}
        <span>{isAudioLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen'}</span>
    </button>`;

reader = reader.replace(targetButton, newButton);

fs.writeFileSync('components/ArticleReader.tsx', reader);
console.log("Patched ArticleReader.tsx successfully.");
