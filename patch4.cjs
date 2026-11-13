const fs = require('fs');
let app = fs.readFileSync('components/EventListRow.tsx', 'utf8');

const target = `{/* Impact/Value */}
                <div className="col-span-2 text-sm font-mono font-medium text-theme-text">
                    {event.impactScore} <span className="text-[10px] text-theme-muted">IMP</span>
                </div>`;

const replacement = `{/* Impact/Value */}
                <div className="col-span-2 text-sm font-mono font-medium text-theme-text flex items-center space-x-2">
                    <span>{event.impactScore} <span className="text-[10px] text-theme-muted">IMP</span></span>
                    {event.truthScore && (
                        <span style={{ color: event.truthScore >= 80 ? '#4ade80' : event.truthScore >= 50 ? '#facc15' : '#f87171' }}>
                            {event.truthScore} <span className="text-[10px] opacity-70">TRU</span>
                        </span>
                    )}
                </div>`;

if (app.includes(target)) {
    app = app.replace(target, replacement);
    fs.writeFileSync('components/EventListRow.tsx', app);
    console.log("Patched successfully.");
} else {
    console.log("Target not found.");
}
