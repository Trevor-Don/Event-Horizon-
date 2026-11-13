const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add rssUrl to initial settings
code = code.replace(/timeBudget: 5\n\s*}\);/, "timeBudget: 5,\n    rssUrl: ''\n  });");

// Add RSS URL input field in the Settings tab
const rssInput = `
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-semibold mb-2">Custom RSS Feed (Optional)</h3>
               <p className="text-sm text-gray-500 mb-4">Enter a direct RSS feed URL to fetch raw news data. If empty, defaults to Google News search.</p>
               <input 
                   type="url" 
                   placeholder="e.g. http://feeds.bbci.co.uk/news/world/rss.xml" 
                   value={settings.rssUrl || ''} 
                   onChange={(e) => setSettings(s => ({ ...s, rssUrl: e.target.value }))}
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-purple"
               />
           </div>
           
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
               <h3 className="text-lg font-semibold mb-4">Default Domain Priority</h3>
`;

code = code.replace(/<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">\s*<h3 className="text-lg font-semibold mb-4">Default Domain Priority<\/h3>/, rssInput);

fs.writeFileSync('App.tsx', code);
console.log("Patched App.tsx with RSS input");
