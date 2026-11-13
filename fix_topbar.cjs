const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    '<div className="hidden md:flex flex-col items-center">',
    '<div className="flex flex-col items-center">'
);

fs.writeFileSync('App.tsx', code);
console.log("Fixed topbar");
