const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove console.warn for fallback
code = code.replace(/console\.warn\("Gemini API failed, falling back to OpenRouter:", error\.message\);/g, 'console.log("Using OpenRouter.");');

// Silence other noisy errors that are handled gracefully
code = code.replace(/console\.error\("Report generation failed:", error\);/g, 'console.log("Report generation gracefully failed.");');
code = code.replace(/console\.error\("Knowledge extraction failed:", error\);/g, 'console.log("Knowledge extraction gracefully failed.");');

fs.writeFileSync('server.ts', code);
console.log("Patched logging");
