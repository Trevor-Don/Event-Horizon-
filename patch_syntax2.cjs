const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const prompt = \\`/g, 'const prompt = `');
code = code.replace(/professional\.\s*\\`/g, 'professional.\n        `');

fs.writeFileSync('server.ts', code);
console.log("Fixed syntax error");
