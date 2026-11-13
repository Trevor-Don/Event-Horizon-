const Parser = require('rss-parser');
const parser = new Parser();

async function test() {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=San+Francisco+News&hl=en-US&gl=US&ceid=US:en');
    console.log(feed.items.slice(0, 2));
}
test();
