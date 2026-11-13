const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/model_id: "eleven_monolingual_v1"/g, 'model_id: "eleven_multilingual_v2"');

fs.writeFileSync('server.ts', code);
console.log("Patched ElevenLabs model");
