const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/SUMMARY: \${event\.summary}/, 'SUMMARY: ${event.summary}\n            RAW DATA: ${event.fullRawData || ""}');

fs.writeFileSync('server.ts', code);
console.log("Patched report with raw data");
