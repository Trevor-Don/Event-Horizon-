const fs = require('fs');
let app = fs.readFileSync('App.tsx', 'utf8');

const target = `<div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold">Impact Score</div>
                                        <div className="text-3xl font-mono font-bold text-theme-gold">{selectedEvent.impactScore}</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold mb-1">Trend</div>
                                        <ImpactTrendChart category={selectedEvent.category} events={displayedEvents} currentScore={selectedEvent.impactScore} />
                                    </div>
                                </div>`;

const replacement = `<div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold">Impact</div>
                                        <div className="text-3xl font-mono font-bold text-theme-gold">{selectedEvent.impactScore}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold">Truth Score</div>
                                        <div className="text-3xl font-mono font-bold" style={{ color: selectedEvent.truthScore && selectedEvent.truthScore >= 80 ? '#4ade80' : selectedEvent.truthScore && selectedEvent.truthScore >= 50 ? '#facc15' : '#f87171' }}>{selectedEvent.truthScore || '--'}</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-xs text-theme-muted uppercase tracking-wider font-bold mb-1">Trend</div>
                                        <ImpactTrendChart category={selectedEvent.category} events={displayedEvents} currentScore={selectedEvent.impactScore} />
                                    </div>
                                </div>
                                {selectedEvent.biasAnalysis && (
                                    <div className="mb-4 text-xs text-theme-muted bg-theme-bg/50 p-2 rounded-lg border border-white/5">
                                        <span className="font-bold text-white mr-1">Bias Analysis:</span> 
                                        {selectedEvent.biasAnalysis}
                                    </div>
                                )}`;

if (app.includes(target)) {
    app = app.replace(target, replacement);
    fs.writeFileSync('App.tsx', app);
    console.log("Patched successfully.");
} else {
    console.log("Target not found.");
}
