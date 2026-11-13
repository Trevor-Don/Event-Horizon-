const fs = require('fs');
let envExample = fs.readFileSync('.env.example', 'utf8');
if (!envExample.includes('ELEVENLABS_API_KEY')) {
    envExample += '\nELEVENLABS_API_KEY=\n';
    fs.writeFileSync('.env.example', envExample);
    console.log('Added ELEVENLABS_API_KEY to .env.example');
}
