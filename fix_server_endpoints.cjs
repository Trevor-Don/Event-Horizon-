const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find startServer
const startServerIndex = code.indexOf('async function startServer() {');

// Find the misplaced /api/tts endpoint at the end of the file
const ttsIndex = code.lastIndexOf("app.post('/api/tts'");

if (ttsIndex > startServerIndex) {
    const ttsCode = code.substring(ttsIndex);
    code = code.substring(0, ttsIndex); // remove it from the end
    
    // Insert it before app.listen(PORT)
    const appListenIndex = code.lastIndexOf('app.listen(PORT');
    code = code.substring(0, appListenIndex) + ttsCode + '\n  ' + code.substring(appListenIndex);
}

fs.writeFileSync('server.ts', code);
console.log("Fixed server.ts endpoint ordering");
