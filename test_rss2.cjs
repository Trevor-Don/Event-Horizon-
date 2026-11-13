const Parser = require('rss-parser');
const parser = new Parser();

async function run() {
    const feed = await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/World.xml");
    console.log(feed.items[0]);
}
run();
