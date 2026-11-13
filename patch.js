const fs = require('fs');
let app = fs.readFileSync('App.tsx', 'utf8');

const target = `<div className="text-right">
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold">Est. Value</div>
                                        <div className="text-lg font-mono text-white">High Priority</div>
                                    </div>`;

const replacement = `<div className="text-right flex flex-col items-end">
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold mb-1">Trend</div>
                                        <ImpactTrendChart category={selectedEvent.category} events={displayedEvents} currentScore={selectedEvent.impactScore} />
                                    </div>`;

if (app.includes(target)) {
    app = app.replace(target, replacement);
    fs.writeFileSync('App.tsx', app);
    console.log("Patched successfully.");
} else {
    console.log("Target not found.");
}
