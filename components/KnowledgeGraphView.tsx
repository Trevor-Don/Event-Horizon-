import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NewsEvent } from '../types';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphData {
  summary: string;
  sentimentScore: number;
  nodes: any[];
  edges: any[];
}

export const KnowledgeGraphView: React.FC<{ events: NewsEvent[] }> = ({ events }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [keywordFilter, setKeywordFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today'>('All');
  const [entityFilter, setEntityFilter] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 720, height: 480 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: Math.max(280, containerRef.current.clientWidth),
          height: Math.max(340, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (
        keywordFilter &&
        !e.headline.toLowerCase().includes(keywordFilter.toLowerCase()) &&
        !e.summary.toLowerCase().includes(keywordFilter.toLowerCase())
      ) {
        return false;
      }

      if (dateFilter === 'Today') {
        const isToday = new Date(e.timestamp).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      }
      return true;
    });
  }, [events, keywordFilter, dateFilter]);

  const buildKnowledgeBase = async () => {
    if (filteredEvents.length === 0) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/extract-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: filteredEvents.map((e) => ({
            id: e.id,
            headline: e.headline,
            summary: e.summary,
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok || data.error || !data.nodes) {
        setGraphData({
          summary: 'Knowledge extraction is currently unavailable due to API limits. Please try again later.',
          sentimentScore: 50,
          nodes: [],
          edges: [],
        });
        return;
      }

      const nodeIds = new Set(data.nodes.map((n: any) => n.id));
      const validEdges = (data.edges || []).filter((e: any) => nodeIds.has(e.source) && nodeIds.has(e.target));

      setGraphData({
        summary: data.summary || 'No synthesis available.',
        sentimentScore: data.sentimentScore || 50,
        nodes: data.nodes || [],
        edges: validEdges,
      });
    } catch (e) {
      console.error('Failed to build knowledge graph', e);
    } finally {
      setIsLoading(false);
    }
  };

  const displayNodes = useMemo(() => {
    if (!graphData) return [];
    let nodes = graphData.nodes;
    if (entityFilter) {
      const connectedEdges = graphData.edges.filter((e) => {
        const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
        const targetId = typeof e.target === 'object' ? e.target.id : e.target;
        return (
          sourceId.toLowerCase().includes(entityFilter.toLowerCase()) ||
          targetId.toLowerCase().includes(entityFilter.toLowerCase())
        );
      });
      const connectedNodeIds = new Set();
      connectedEdges.forEach((e) => {
        const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
        const targetId = typeof e.target === 'object' ? e.target.id : e.target;
        connectedNodeIds.add(sourceId);
        connectedNodeIds.add(targetId);
      });
      nodes = nodes.filter(
        (n) => connectedNodeIds.has(n.id) || n.id.toLowerCase().includes(entityFilter.toLowerCase())
      );
    }
    return nodes;
  }, [graphData, entityFilter]);

  const displayEdges = useMemo(() => {
    if (!graphData) return [];
    let edges = graphData.edges;
    if (entityFilter) {
      edges = edges.filter((e) => {
        const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
        const targetId = typeof e.target === 'object' ? e.target.id : e.target;
        return (
          sourceId.toLowerCase().includes(entityFilter.toLowerCase()) ||
          targetId.toLowerCase().includes(entityFilter.toLowerCase())
        );
      });
    }
    return edges;
  }, [graphData, entityFilter]);

  return (
    <div className="flex flex-col h-full text-[#231B15] space-y-6">
      <div className="border-b border-[#DFD6C7] pb-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6E6256] mb-1">
          Entity Ledger &amp; Relationship Cartography
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-[#231B15]">
          Knowledge Graph
        </h2>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 p-4 bg-[#FAF7F1] rounded-2xl border border-[#DFD6C7]">
          <div className="flex flex-col flex-1 min-w-[160px]">
            <label className="text-[10px] text-[#6E6256] font-mono mb-1 uppercase tracking-wider">
              Keyword Filter
            </label>
            <input
              type="text"
              className="px-3 py-2 bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl text-sm outline-none focus:border-[#A94424] min-h-[42px]"
              placeholder="Filter dispatches..."
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:w-40">
            <label className="text-[10px] text-[#6E6256] font-mono mb-1 uppercase tracking-wider">
              Timeframe
            </label>
            <select
              className="px-3 py-2 bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl text-sm outline-none focus:border-[#A94424] min-h-[42px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'All' | 'Today')}
            >
              <option value="All">All Dispatches</option>
              <option value="Today">Today Only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={buildKnowledgeBase}
            disabled={isLoading || filteredEvents.length === 0}
            className="px-5 py-2.5 bg-[#A94424] hover:bg-[#8B3218] text-[#FAF7F1] rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors min-h-[42px] whitespace-nowrap"
          >
            {isLoading ? 'Mapping Entities...' : 'Analyze & Build Graph'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Graph Canvas */}
        <div
          className="flex-1 min-h-[380px] lg:min-h-[500px] rounded-2xl border border-[#DFD6C7] bg-[#FAF7F1] overflow-hidden relative"
          ref={containerRef}
        >
          {graphData ? (
            <>
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="text"
                  className="px-3 py-1.5 bg-[#F4EFE6]/95 backdrop-blur-sm border border-[#DFD6C7] rounded-lg text-xs outline-none focus:border-[#A94424] text-[#231B15]"
                  placeholder="Filter by entity..."
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                />
              </div>

              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes: displayNodes, links: displayEdges }}
                nodeLabel="id"
                nodeColor={(node: any) => {
                  switch (node.type) {
                    case 'Person':
                      return '#A94424';
                    case 'Organization':
                      return '#2B4C7E';
                    case 'Location':
                      return '#52664A';
                    case 'Concept':
                      return '#7A5C3E';
                    default:
                      return '#6E6256';
                  }
                }}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                linkLabel="label"
                backgroundColor="#FAF7F1"
                linkColor={() => 'rgba(110, 98, 86, 0.35)'}
              />

              <div className="absolute bottom-3 left-3 z-10 bg-[#F4EFE6]/95 backdrop-blur-sm p-3 rounded-xl border border-[#DFD6C7] text-[11px] font-mono text-[#231B15] grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A94424]" /> Person
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2B4C7E]" /> Organization
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#52664A]" /> Location
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7A5C3E]" /> Concept
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="font-serif italic text-base text-[#5C5146]">
                No relationship map generated for this edition yet.
              </p>
              <p className="text-xs font-mono text-[#6E6256] mt-2">
                Click &ldquo;Analyze &amp; Build Graph&rdquo; above to extract entities across {filteredEvents.length}{' '}
                dispatches.
              </p>
            </div>
          )}
        </div>

        {/* Synthesis Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          {graphData && (
            <>
              <div className="p-5 bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl">
                <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#A94424] font-semibold mb-2">
                  Editorial Synthesis
                </h3>
                <p className="font-serif text-sm text-[#231B15] leading-relaxed">{graphData.summary}</p>
              </div>

              <div className="p-5 bg-[#FAF7F1] border border-[#DFD6C7] rounded-2xl">
                <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#6E6256] font-semibold mb-3">
                  Cartography Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-[#6E6256] mb-1.5">
                      <span>Overall Sentiment</span>
                      <span className="font-mono font-semibold text-[#231B15] tabular-nums">
                        {graphData.sentimentScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#ECE5D8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${graphData.sentimentScore}%`,
                          backgroundColor:
                            graphData.sentimentScore > 60
                              ? '#52664A'
                              : graphData.sentimentScore < 40
                              ? '#A94424'
                              : '#9B7B3C',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl">
                      <div className="text-[10px] text-[#6E6256] font-mono uppercase mb-0.5">Entities</div>
                      <div className="text-xl font-serif font-bold text-[#231B15] tabular-nums">
                        {displayNodes.length}
                      </div>
                    </div>
                    <div className="p-3 bg-[#F4EFE6] border border-[#DFD6C7] rounded-xl">
                      <div className="text-[10px] text-[#6E6256] font-mono uppercase mb-0.5">Relations</div>
                      <div className="text-xl font-serif font-bold text-[#231B15] tabular-nums">
                        {displayEdges.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
