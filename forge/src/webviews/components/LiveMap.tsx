import React, { useEffect, useState } from 'react';

interface Node {
    id: string;
    label: string;
    type: 'input' | 'process' | 'storage' | 'external' | 'security';
    x: number;
    y: number;
}

interface Edge {
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed';
}

interface LiveMapProps {
    code?: string;
    services?: string[];
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    input:    { bg: '#0e1a2f', border: '#3b82f6', text: '#60a5fa' },
    process:  { bg: '#0e2a1a', border: '#22c55e', text: '#4ade80' },
    storage:  { bg: '#2a1a0e', border: '#f59e0b', text: '#fbbf24' },
    external: { bg: '#1a0e2a', border: '#a855f7', text: '#c084fc' },
    security: { bg: '#2a0e0e', border: '#ef4444', text: '#f87171' },
};

const DEFAULT_NODES: Node[] = [
    { id: 'client', label: 'Client / Browser', type: 'input',    x: 160, y: 40  },
    { id: 'api',    label: 'Express API',      type: 'process',  x: 160, y: 140 },
    { id: 'auth',   label: 'JWT Auth / Guard', type: 'security', x: 320, y: 140 },
    { id: 'mongo',  label: 'MongoDB (DRIFT)',  type: 'storage',  x: 60,  y: 240 },
    { id: 'redis',  label: 'Redis Cache',      type: 'storage',  x: 260, y: 240 },
    { id: 's3',     label: 'AWS S3 (Unauth)', type: 'external', x: 160, y: 340 },
    { id: 'lambda', label: 'Lambda / Bedrock', type: 'external', x: 320, y: 280 },
];

const DEFAULT_EDGES: Edge[] = [
    { from: 'client', to: 'api',    label: 'HTTP/REST' },
    { from: 'api',    to: 'auth',   label: 'Verify', style: 'dashed' },
    { from: 'api',    to: 'mongo',  label: 'Read/Write' },
    { from: 'api',    to: 'redis',  label: 'Cache', style: 'dashed' },
    { from: 'api',    to: 's3',     label: 'Upload' },
    { from: 'api',    to: 'lambda', label: 'Invoke', style: 'dashed' },
];

const W = 120;
const H = 38;

export const LiveMap: React.FC<LiveMapProps> = ({ code, services }) => {
    const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
    const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);
    const [hovered, setHovered] = useState<string | null>(null);

    // Update nodes based on detected services
    useEffect(() => {
        if (services && services.length > 0) {
            const serviceMap: Node[] = [
                { id: 'client', label: 'Client', type: 'input', x: 160, y: 40 },
            ];
            let y = 140;
            if (services.some(s => s.includes('express') || s.includes('next'))) {
                serviceMap.push({ id: 'api', label: 'API Server', type: 'process', x: 160, y });
                y += 100;
            }
            if (services.some(s => s.includes('mongo'))) {
                serviceMap.push({ id: 'mongo', label: 'MongoDB', type: 'storage', x: 60, y });
            }
            if (services.some(s => s.includes('rds') || s.includes('postgres'))) {
                serviceMap.push({ id: 'rds', label: 'PostgreSQL', type: 'storage', x: 160, y });
            }
            if (services.some(s => s.includes('redis'))) {
                serviceMap.push({ id: 'redis', label: 'Redis Cache', type: 'storage', x: 280, y });
            }
            if (services.some(s => s.includes('s3'))) {
                y += 100;
                serviceMap.push({ id: 's3', label: 'AWS S3', type: 'external', x: 160, y });
            }
            if (serviceMap.length > 1) setNodes(serviceMap);
        }
    }, [services]);

    const getNodePos = (id: string) => nodes.find(n => n.id === id);

    const SVG_W = 440;
    const SVG_H = 420;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <h3 className="text-[9px] font-black uppercase text-fg/40 tracking-widest">Infrastructure Map · Live</h3>
                <span className="flex items-center gap-1 text-[8px] font-black uppercase text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                    Auto-detected
                </span>
            </div>

            <div className="bg-[#050810] border border-border overflow-hidden" style={{ borderRadius: 4 }}>
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    width="100%"
                    style={{ display: 'block' }}
                >
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        </pattern>
                        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
                        </marker>
                        <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
                        </marker>
                    </defs>
                    <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

                    {/* Edges */}
                    {edges.map((e, i) => {
                        const from = getNodePos(e.from);
                        const to = getNodePos(e.to);
                        if (!from || !to) return null;
                        const x1 = from.x + W / 2;
                        const y1 = from.y + H;
                        const x2 = to.x + W / 2;
                        const y2 = to.y;
                        const mx = (x1 + x2) / 2;
                        const my = (y1 + y2) / 2;
                        return (
                            <g key={i}>
                                <path
                                    d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeWidth={e.style === 'dashed' ? 1 : 1.5}
                                    strokeDasharray={e.style === 'dashed' ? '4 3' : 'none'}
                                    markerEnd="url(#arrow)"
                                />
                                {e.label && (
                                    <text x={mx} y={my - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontWeight="700" letterSpacing="0.5">
                                        {e.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map(n => {
                        const colors = TYPE_COLORS[n.type];
                        const isHov = hovered === n.id;
                        return (
                            <g key={n.id}
                                onMouseEnter={() => setHovered(n.id)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <rect
                                    x={n.x} y={n.y} width={W} height={H}
                                    rx={4}
                                    fill={colors.bg}
                                    stroke={isHov ? colors.text : colors.border}
                                    strokeWidth={isHov ? 1.5 : 1}
                                    style={{ transition: 'all 0.15s' }}
                                />
                                <text
                                    x={n.x + W / 2} y={n.y + H / 2 + 1}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill={colors.text}
                                    fontSize="9" fontWeight="900"
                                    letterSpacing="0.5"
                                >
                                    {n.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                {Object.entries(TYPE_COLORS).map(([type, c]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg/30">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
