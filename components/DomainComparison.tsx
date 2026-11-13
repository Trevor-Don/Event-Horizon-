import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DomainComparisonProps {
  domains: string[];
}

export const DomainComparison: React.FC<DomainComparisonProps> = ({ domains }) => {
  const [domain1, setDomain1] = useState<string>(domains[0] || 'Technology');
  const [domain2, setDomain2] = useState<string>(domains[1] || 'Geopolitics');

  // Generate realistic-looking time series data
  const data = useMemo(() => {
    const result = [];
    let d1Volume = 50;
    let d2Volume = 40;
    
    // Seed random based on domain names to be deterministic-ish
    const seed1 = domain1.length;
    const seed2 = domain2.length;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random walk
      d1Volume = Math.max(10, d1Volume + (Math.random() - 0.5) * 20 * (seed1 % 3 + 1));
      d2Volume = Math.max(10, d2Volume + (Math.random() - 0.5) * 20 * (seed2 % 3 + 1));

      result.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        [domain1]: Math.round(d1Volume),
        [domain2]: Math.round(d2Volume)
      });
    }
    return result;
  }, [domain1, domain2]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-bold">Domain Volume Comparison</h2>
      </div>

      <div className="bg-theme-panel/50 rounded-3xl p-8 flex-1 flex flex-col space-y-8">
        
        {/* Controls */}
        <div className="flex space-x-6 items-center">
          <div className="flex flex-col space-y-2">
            <label className="text-xs text-theme-muted uppercase font-bold tracking-wider">Domain 1</label>
            <select 
              value={domain1}
              onChange={(e) => setDomain1(e.target.value)}
              className="bg-theme-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-theme-text/20 min-w-[200px]"
            >
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="text-theme-muted font-bold text-xl mt-6">vs</div>

          <div className="flex flex-col space-y-2">
            <label className="text-xs text-theme-muted uppercase font-bold tracking-wider">Domain 2</label>
            <select 
              value={domain2}
              onChange={(e) => setDomain2(e.target.value)}
              className="bg-theme-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-theme-text/20 min-w-[200px]"
            >
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 w-full min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorD1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorD2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#ffffff50" 
                tick={{fill: '#ffffff50', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#ffffff50" 
                tick={{fill: '#ffffff50', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E1E1E', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area 
                type="monotone" 
                dataKey={domain1} 
                stroke="#A78BFA" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorD1)" 
              />
              <Area 
                type="monotone" 
                dataKey={domain2} 
                stroke="#34D399" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorD2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};
