import React, { useEffect, useState } from 'react';
import ReactFlow, { 
    Node, 
    Edge, 
    Background, 
    Controls,
    MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ArchitectureDiagramProps {
    code?: string;
    language?: string;
    isDemo?: boolean;
    apiUrl?: string;
}

const FALLBACK_NODES: Node[] = [
    { id: '1', type: 'input', data: { label: 'INFRASTRUCTURE MAP', service: 'system' }, position: { x: 250, y: 50 }, style: getNodeStyle() },
];

const FALLBACK_EDGES: Edge[] = [];

export function ArchitectureDiagram({ code, language, isDemo = false, apiUrl = 'https://ghwl6o43ch.execute-api.eu-north-1.amazonaws.com/dev' }: ArchitectureDiagramProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        updateDiagram();
    }, [code]);

    async function updateDiagram() {
        if (!code?.trim()) {
            setNodes([]);
            setEdges([]);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/diagram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language: language || 'javascript' })
            });

            const data = await response.json();

            const flowNodes: Node[] = data.nodes.map((node: any, index: number) => ({
                id: node.id,
                type: 'default',
                position: calculatePosition(index, data.nodes.length),
                data: { label: node.label, service: node.service },
                style: getNodeStyle()
            }));

            const flowEdges: Edge[] = data.edges.map((edge: any) => ({
                id: `${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                animated: true,
                style: { stroke: 'var(--color-card-border)' }
            }));

            setNodes(flowNodes);
            setEdges(flowEdges);
        } catch (error) {
            console.error('Failed to update diagram:', error);
            setNodes(FALLBACK_NODES);
            setEdges(FALLBACK_EDGES);
        } finally {
            setLoading(false);
        }
    }

    function calculatePosition(index: number, total: number): { x: number; y: number } {
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return { x: col * 200 + 50, y: row * 150 + 50 };
    }

    return (
        <div className="w-full h-[400px] border border-card-border bg-[#050505] overflow-hidden relative rounded-xl">
            {loading && (
                <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <span className="text-fg/40 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Map...</span>
                </div>
            )}
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background color="var(--color-card-border)" gap={24} size={1} />
                <Controls className="bg-card-bg border border-card-border fill-white" />
                <MiniMap className="bg-card-bg border border-card-border" maskColor="rgba(0, 0, 0, 0.4)" />
            </ReactFlow>
        </div>
    );
}

function getNodeStyle() {
    return {
        background: 'var(--color-card-bg)',
        color: 'var(--color-text-main)',
        border: '1px solid var(--color-card-border)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '9px',
        fontWeight: '900' as const,
        minWidth: '120px',
        textAlign: 'center' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em'
    };
}

