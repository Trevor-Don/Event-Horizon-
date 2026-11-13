const fs = require('fs');

let code = fs.readFileSync('components/ArticleReader.tsx', 'utf8');

const oldLinkComponent = `                                a: ({node, ...props}) => (
                                    <a target="_blank" rel="noopener noreferrer" title={props.href || "Reference Source"} {...props} className="inline-flex items-center gap-1 group relative">
                                        {props.children}
                                        <svg className="w-3 h-3 text-theme-purple/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                )`;

const newLinkComponent = `                                a: ({node, ...props}) => {
                                    // Extract the hostname for a cleaner tooltip display
                                    let hostname = props.href || "";
                                    try {
                                        if (props.href) hostname = new URL(props.href).hostname.replace('www.', '');
                                    } catch (e) {}

                                    return (
                                        <span className="relative inline-block group ml-1">
                                            <a target="_blank" rel="noopener noreferrer" href={props.href} className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-md bg-theme-purple/10 text-theme-purple border border-theme-purple/20 hover:bg-theme-purple hover:text-white transition-colors align-baseline font-bold no-underline cursor-pointer">
                                                {props.children || hostname || 'Link'}
                                                <svg className="w-2.5 h-2.5 ml-0.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] break-words text-center">
                                                <span className="block font-semibold text-gray-300 mb-0.5 text-[10px] uppercase tracking-wider">Reference Source</span>
                                                <span className="block truncate opacity-90 text-[10px] font-mono">{props.href}</span>
                                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                            </span>
                                        </span>
                                    );
                                }`;

code = code.replace(oldLinkComponent, newLinkComponent);
fs.writeFileSync('components/ArticleReader.tsx', code);
console.log("Updated Tooltip Links");
