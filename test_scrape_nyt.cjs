const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function scrape(url) {
    try {
        const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } });
        const doc = new JSDOM(res.data, { url });
        let reader = new Readability(doc.window.document);
        let article = reader.parse();
        if (article) {
            console.log("Length:", article.textContent.length);
            console.log("Snippets:\n", article.textContent.substring(0, 500).replace(/\s+/g, ' '));
        } else {
            console.log("Could not parse article");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

scrape("https://www.nytimes.com/2026/07/16/world/europe/ukraine-fedorov-protests.html");
