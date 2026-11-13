const fs = require('fs');

let code = fs.readFileSync('components/ArticleReader.tsx', 'utf8');
code = code.replace(
    'title="Reference Source"',
    'title={props.href || "Reference Source"}'
);
fs.writeFileSync('components/ArticleReader.tsx', code);
console.log("Updated hover title");
