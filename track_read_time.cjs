const fs = require('fs');

let code = fs.readFileSync('components/ArticleReader.tsx', 'utf8');

// We need to add a timer in ArticleReader to track how long it's open.
// And a way to bubble that up or save it. Wait, the easiest is to just have ArticleReader accept an onReadTime callback, or just save it directly to localStorage.

const importLine = `import React, { useState, useEffect, useRef } from 'react';`;
if (!code.includes(importLine)) {
    code = code.replace(/import React[^;]+;/, importLine);
}

// Add onReadTime prop if not there
if (!code.includes('onReadTime?: (eventId: string, category: string, timeMs: number) => void;')) {
    code = code.replace(
        'event: NewsEvent;',
        'event: NewsEvent;\n  onReadTime?: (eventId: string, category: string, timeMs: number) => void;'
    );
}

// Add useEffect to track time
const timerHook = `
    const startTimeRef = useRef<number>(Date.now());
    
    useEffect(() => {
        startTimeRef.current = Date.now();
        return () => {
            const timeSpent = Date.now() - startTimeRef.current;
            if (onReadTime) {
                onReadTime(event.id, event.category, timeSpent);
            }
        };
    }, [event.id, event.category, onReadTime]);
`;

if (!code.includes('startTimeRef.current')) {
    code = code.replace(
        'const [report, setReport] = useState<string | null>(null);',
        'const [report, setReport] = useState<string | null>(null);\n' + timerHook
    );
}

// Show propaganda warning in ArticleReader
const propagandaWarningUi = `
                {event.isClickbaitOrPropaganda && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start space-x-3">
                        <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h4 className="font-bold text-sm">Potential Clickbait or Propaganda</h4>
                            <p className="text-sm mt-1">{event.clickbaitWarning || 'This article has been flagged by the system as potentially misleading.'}</p>
                        </div>
                    </div>
                )}
`;

if (!code.includes('isClickbaitOrPropaganda')) {
    code = code.replace(
        '<div className="prose prose-lg max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-a:text-theme-purple">',
        propagandaWarningUi + '\n                <div className="prose prose-lg max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-a:text-theme-purple">'
    );
}

fs.writeFileSync('components/ArticleReader.tsx', code);
console.log("Updated ArticleReader.tsx");
