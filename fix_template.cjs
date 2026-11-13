const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\\\$\{/g, '${');

fs.writeFileSync('server.ts', code);
console.log("Fixed template strings");
