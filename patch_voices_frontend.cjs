const fs = require('fs');
let code = fs.readFileSync('components/AudioPlayer.tsx', 'utf8');

const newVoices = `const VOICES = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', label: 'Deep & Authoritative' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', label: 'Calm & Professional' },
    { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', label: 'War Veteran' },
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', label: 'Irish Sailor' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', label: 'Reassuring & Confident' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', label: 'Confident & Energetic' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', label: 'Warm Storyteller' }
];`;

code = code.replace(/const VOICES = \[\s*\{[\s\S]*?\];/, newVoices);

// also update the default selected voice
code = code.replace(/const \[selectedVoice, setSelectedVoice\] = useState<string>\('Kore'\);/, "const [selectedVoice, setSelectedVoice] = useState<string>('pNInz6obpgDQGcFmaJgB');");

fs.writeFileSync('components/AudioPlayer.tsx', code);
console.log("Patched AudioPlayer.tsx voices");
