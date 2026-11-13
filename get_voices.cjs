const axios = require('axios');
async function run() {
    const res = await axios.get("https://api.elevenlabs.io/v1/voices");
    console.log(res.data.voices.slice(0, 10).map(v => ({ name: v.name, id: v.voice_id })));
}
run();
