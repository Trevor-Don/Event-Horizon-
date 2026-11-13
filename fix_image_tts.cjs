const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const imageEndpoint = `
app.post('/api/image', async (req: Request, res: Response): Promise<void> => {
    res.json({ image: null }); // Mocked to avoid failures if no image gen service available
});
`;
if (!code.includes('/api/image')) {
    code = code.replace(/app\.post\('\/api\/tts'/g, imageEndpoint.trim() + '\n\napp.post(\'/api/tts\'');
}

// Fix elevenlabs voice ID
code = code.replace(/'Kore': 'Zza0Z5Qk1b702P4UoXQv'/g, "'Kore': 'pNInz6obpgDQGcFmaJgB'");

fs.writeFileSync('server.ts', code);
console.log("Fixed image and tts");
