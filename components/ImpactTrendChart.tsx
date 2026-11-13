import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { NewsEvent } from '../types';

interface ImpactTrendChartProps {
    category: string;
    events: NewsEvent[];
    currentScore: number;
}

export const ImpactTrendChart: React.FC<ImpactTrendChartProps> = ({ category, events, currentScore }) => {
    const data = useMemo(() => {
        // Find events in the same category
        const categoryEvents = events
            .filter(e => e.category === category)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(e => ({ value: e.impactScore }));
        
        // Ensure we end at currentScore for smooth transition
        const hasEnoughData = categoryEvents.length >= 5;
        
        if (!hasEnoughData) {
            const syntheticData = [];
            // Generate some random walk data leading up to the current score
            let val = currentScore;
            syntheticData.unshift({ value: val });
            for (let i = 0; i < 6; i++) {
                val = Math.max(0, Math.min(100, val - (Math.random() * 20 - 5)));
                syntheticData.unshift({ value: Math.round(val) });
            }
            return syntheticData;
        }

        return categoryEvents;
    }, [category, events, currentScore]);

    return (
        <div className="h-12 w-24">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FFD700" 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
