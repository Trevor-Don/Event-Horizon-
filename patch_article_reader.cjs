const fs = require('fs');
let code = fs.readFileSync('components/ArticleReader.tsx', 'utf8');

const downloadFunc = `  const handleDownload = () => {
      const textContent = \`# \${event.headline}\\n\\n\${content}\`;
      const blob = new Blob([textContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`\${event.headline.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (`;

code = code.replace("  return (", downloadFunc);

const downloadButton = `                <button 
                    onClick={handleDownload}
                    className="flex items-center space-x-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition-all text-gray-700 font-medium"
                    title="Download to read offline"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download</span>
                </button>
                <button 
                    onClick={handleListen}`;

code = code.replace("                <button \n                    onClick={handleListen}", downloadButton);

fs.writeFileSync('components/ArticleReader.tsx', code);
console.log("Patched ArticleReader.tsx");
