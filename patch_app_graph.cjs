const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const importStatement = `import { KnowledgeGraphView } from './components/KnowledgeGraphView';`;
if (!code.includes('KnowledgeGraphView')) {
    code = code.replace(`import { SavedEventsList }`, `${importStatement}\nimport { SavedEventsList }`);
}

// Update state to include 'Knowledge'
if (code.includes(`useState<'Home' | 'Events' | 'Audio' | 'Saved' | 'Settings'>('Home')`)) {
    code = code.replace(`useState<'Home' | 'Events' | 'Audio' | 'Saved' | 'Settings'>('Home')`, `useState<'Home' | 'Events' | 'Graph' | 'Audio' | 'Saved' | 'Settings'>('Home')`);
}

// Add Knowledge Icon
const graphIcon = `
const GraphIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
`;
if (!code.includes('GraphIcon')) {
    code = code.replace(`const UserIcon`, `${graphIcon}\const UserIcon`);
}

// Add Knowledge Tab to sidebar
const newSidebarTab = `
          <button onClick={() => setNavTab('Graph')} className={\`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 \${navTab === 'Graph' ? 'bg-theme-purple text-white shadow-lg shadow-theme-purple/30' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}\`} title="Knowledge Graph">
            <GraphIcon />
          </button>
`;

if (!code.includes(`setNavTab('Graph')`)) {
    code = code.replace(
        `          <button onClick={() => setNavTab('Audio')}`,
        newSidebarTab + `\n          <button onClick={() => setNavTab('Audio')}`
    );
}

// Add Knowledge render logic
const newRenderLogic = `
        {navTab === 'Graph' && (
            <KnowledgeGraphView events={events} />
        )}
`;

if (!code.includes(`{navTab === 'Graph' &&`)) {
    code = code.replace(
        `{navTab === 'Events' && (`,
        newRenderLogic + `\n        {navTab === 'Events' && (`
    );
}

fs.writeFileSync('App.tsx', code);
console.log("Updated App.tsx with Knowledge Graph tab");
