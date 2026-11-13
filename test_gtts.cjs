const googleTTS = require('google-tts-api');

async function test() {
    try {
        const url = googleTTS.getAudioUrl('Hello world', {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });
        console.log(url);
        
        const b64 = await googleTTS.getAudioBase64('Hello world', {
            lang: 'en-US',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });
        console.log(b64.substring(0, 100));
    } catch (e) {
        console.error(e);
    }
}
test();
