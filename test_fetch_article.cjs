const axios = require('axios');
const cheerio = require('cheerio');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function run() {
    try {
        const url = "https://news.google.com/rss/articles/CBMiigFodHRwczovL3d3dy5iYmMuY29tL25ld3MvYXJ0aWNsZXMvYzF2ODh5NzJqbDlvP2FwcC1wcm9tbW8tZGF0YT0lN0IlMjJwaWQlMjIlM0FudWxsJTdEJmFwcC1wcm9tby1zb3VyY2U9YmJjX25ld3NfYXBwX3Byb21vX3BhZ2VfM18wXzA_XzBfMF8wXzDSAY8BaHR0cHM6Ly93d3cuYmJjLmNvbS9uZXdzL2FydGljbGVzL2Mxdjg4eTcyamw5by5hbXA_YXBwLXByb21tby1kYXRhPSU3QiUyMnBpZCUyMiUzQW51bGwlN0QmYXBwLXByb21vLXNvdXJjZT1iYmNfbmV3c19hcHBfcHJvbW9fcGFnZV8zXzBfMD9fMF8wXzBfMA?oc=5";
        
        const response = await fetch(url, { redirect: 'manual' });
        console.log("Status:", response.status, response.headers.get('location'));
        
        if (response.status >= 300 && response.status < 400) {
             const loc = response.headers.get('location');
             const res2 = await fetch(loc);
             const text = await res2.text();
             const doc = new JSDOM(text, { url: loc });
             let reader = new Readability(doc.window.document);
             let article = reader.parse();
             console.log("Snipper2:", article ? article.textContent.replace(/\s+/g, ' ').substring(0, 200) : null);
        }
    } catch (e) {
        console.error(e.message);
    }
}
run();
