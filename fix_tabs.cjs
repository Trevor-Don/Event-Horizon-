const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    `{navTab === 'Events' && (`,
    `<div className="md:hidden">{navTab !== 'Home' && renderTopBar()}</div>\n        {navTab === 'Events' && (`
);

fs.writeFileSync('App.tsx', code);
console.log("Fixed tabs");
