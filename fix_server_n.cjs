const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/\\napp\.listen\(PORT/g, '\n  app.listen(PORT');
fs.writeFileSync('server.ts', code);
console.log("Fixed syntax error");
