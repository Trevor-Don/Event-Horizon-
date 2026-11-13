const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function scrape(url) {
    const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const doc = new JSDOM(res.data, { url });
    let reader = new Readability(doc.window.document);
    let article = reader.parse();
    console.log(article.textContent.substring(0, 500).replace(/\s+/g, ' '));
}

scrape("https://www.bbc.com/news/articles/c1v88y72jl9o");
