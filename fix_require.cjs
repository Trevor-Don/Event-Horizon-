const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const googleTTS = require\('google-tts-api'\);/, 'import * as googleTTS from "google-tts-api";');

fs.writeFileSync('server.ts', code);
console.log("Fixed require");
