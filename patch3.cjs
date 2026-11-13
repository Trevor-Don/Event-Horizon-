const fs = require('fs');
let app = fs.readFileSync('components/EventCard.tsx', 'utf8');

const target = `<div className="flex items-center space-x-1">
                 <span className="text-[10px] text-theme-gold font-bold">{event.impactScore} IMP</span>
             </div>`;

const replacement = `<div className="flex items-center space-x-2">
                 <span className="text-[10px] text-theme-gold font-bold" title="Impact Score">{event.impactScore} IMP</span>
                 {event.truthScore && (
                    <span className="text-[10px] font-bold" style={{ color: event.truthScore >= 80 ? '#4ade80' : event.truthScore >= 50 ? '#facc15' : '#f87171' }} title="Truth Score">
                        {event.truthScore} TRU
                    </span>
                 )}
             </div>`;

if (app.includes(target)) {
    app = app.replace(target, replacement);
    fs.writeFileSync('components/EventCard.tsx', app);
    console.log("Patched successfully.");
} else {
    console.log("Target not found.");
}
