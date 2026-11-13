const fs = require('fs');

// 1. EventCard
let code = fs.readFileSync('components/EventCard.tsx', 'utf8');
const warningCardHtml = `
            {event.isClickbaitOrPropaganda && (
                <div className="absolute top-2 left-2 z-10 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center space-x-1 backdrop-blur-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Warning</span>
                </div>
            )}
`;

if (!code.includes('isClickbaitOrPropaganda')) {
    code = code.replace(
        '<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">',
        warningCardHtml + '\n            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end">'
    );
}

fs.writeFileSync('components/EventCard.tsx', code);


// 2. EventListRow
code = fs.readFileSync('components/EventListRow.tsx', 'utf8');

const warningRowHtml = `
                        {event.isClickbaitOrPropaganda && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span>Caution</span>
                            </span>
                        )}
`;

if (!code.includes('isClickbaitOrPropaganda')) {
    code = code.replace(
        '<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{event.category}</span>',
        '<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{event.category}</span>' + warningRowHtml
    );
}
fs.writeFileSync('components/EventListRow.tsx', code);

console.log("Updated EventCard and EventListRow");
