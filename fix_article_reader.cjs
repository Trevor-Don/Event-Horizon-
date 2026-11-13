const fs = require('fs');
let code = fs.readFileSync('components/ArticleReader.tsx', 'utf8');

// Undo the mistake
const badString = `  useEffect(() => {
      startTimeRef.current = Date.now();
      const handleDownload = () => {
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

  return () => {`;

const fixedString = `  useEffect(() => {
      startTimeRef.current = Date.now();
      return () => {`;

code = code.replace(badString, fixedString);

// Find the correct return (
const mainReturn = `  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">`;

const correctDownloadFunc = `  const handleDownload = () => {
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

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">`;

if (code.includes(mainReturn)) {
    code = code.replace(mainReturn, correctDownloadFunc);
    fs.writeFileSync('components/ArticleReader.tsx', code);
    console.log("Fixed ArticleReader.tsx");
} else {
    console.log("mainReturn not found in ArticleReader.tsx!");
}

