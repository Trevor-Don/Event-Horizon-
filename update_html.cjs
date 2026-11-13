const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<script src="https://cdn.tailwindcss.com?plugins=typography"></script>'
);
fs.writeFileSync('index.html', code);
console.log("Updated index.html to include typography plugin");
