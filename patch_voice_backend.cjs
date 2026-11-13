const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const voiceId = voiceMap\[voiceName\] \|\| voiceMap\['Kore'\];/, 'const voiceId = voiceMap[voiceName] || voiceName || "pNInz6obpgDQGcFmaJgB";');

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts voiceMap logic");
