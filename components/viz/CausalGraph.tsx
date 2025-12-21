'use client';

import React, { memo, useMemo, useState } from 'react';
import { safeNumber } from '@/lib/utils/safeNumber';

export interface CausalEdge {
    from: string;
    to: string;
    strength: number; // 0-1
    causalLabel: 'strong' | 'likely' | 'correlational' | 'unknown';
}

export interface CausalNode {
    id: string;
    label: string;
    value: number; // 0-1, for sizing
    uncertainty: number; // 0-1
}

export interface CausalGraphProps {
    nodes: CausalNode[];
    edges: CausalEdge[];
    height?: number;
    explainToken?: string;
}

const CAUSAL_STYLES = {
    strong: { dashArray: 'none', opacity: 0.9, width: 3 },
    likely: { dashArray: 'none', opacity: 0.7, width: 2 },
    correlational: { dashArray: '4 4', opacity: 0.4, width: 1.5 },
    unknown: { dashArray: '2 4', opacity: 0.2, width: 1 },
};

/**
 * CausalGraph - Directed graph of construct influences
 * 
 * Visual Encoding:
 * - Edge thickness = strength
 * - Dashed = correlational (not causal)
 * - Node size = value
 * - Node blur = uncertainty
 */
function CausalGraphComponent({
    nodes,
    edges,
    height = 200,
    explainToken,
}: CausalGraphProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Layout nodes in a force-directed-like arrangement
    const nodePositions = useMemo(() => {
        const positions: Record<string, { x: number; y: number }> = {};
        const count = nodes.length;
        const centerX = 50;
        const centerY = 50;
        const radius = 35;

        nodes.forEach((node, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            positions[node.id] = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            };
        });

        return positions;
    }, [nodes]);

    // Filter edges for hovered node
    const visibleEdges = useMemo(() => {
        if (!hoveredNode) return edges;
        return edges.filter(e => e.from === hoveredNode || e.to === hoveredNode);
    }, [edges, hoveredNode]);

    if (nodes.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-slate-600 text-sm italic"
                style={{ height }}
            >
                No causal structure available
            </div>
        );
    }

    return (
        <div
            className="relative w-full"
            style={{ height }}
            data-explain-token={explainToken}
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
            >
                {/* Edges */}
                {visibleEdges.map((edge, i) => {
                    const from = nodePositions[edge.from];
                    const to = nodePositions[edge.to];
                    if (!from || !to) return null;

                    const style = CAUSAL_STYLES[edge.causalLabel];
                    const isHovered = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);

                    // Calculate arrow midpoint
                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;
                    const angle = Math.atan2(to.y - from.y, to.x - from.x);

                    return (
                        <g key={`${edge.from}-${edge.to}-${i}`}>
                            {/* Edge line */}
                            <line
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke="#64748b"
                                strokeWidth={style.width * safeNumber(edge.strength)}
                                strokeDasharray={style.dashArray}
                                opacity={isHovered ? 1 : style.opacity}
                                className="transition-opacity duration-300"
                            />
                            {/* Arrow head */}
                            <polygon
                                points={`0,-2 4,0 0,2`}
                                fill="#64748b"
                                opacity={style.opacity}
                                transform={`translate(${midX + Math.cos(angle) * 3}, ${midY + Math.sin(angle) * 3}) rotate(${angle * 180 / Math.PI})`}
                            />
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;

                    const nodeSize = 4 + safeNumber(node.value) * 6;
                    const isHovered = hoveredNode === node.id;
                    const isRelated = hoveredNode && edges.some(
                        e => (e.from === hoveredNode && e.to === node.id) ||
                            (e.to === hoveredNode && e.from === node.id)
                    );

                    return (
                        <g
                            key={node.id}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            className="cursor-pointer"
                        >
                            {/* Uncertainty halo */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={nodeSize + safeNumber(node.uncertainty) * 5}
                                fill="rgba(100, 116, 139, 0.1)"
                                className="transition-all duration-300"
                            />
                            {/* Node core */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={nodeSize}
                                fill={isHovered || isRelated ? '#8b5cf6' : '#475569'}
                                opacity={hoveredNode && !isHovered && !isRelated ? 0.3 : 1}
                                className="transition-all duration-300"
                            />
                            {/* Label */}
                            <text
                                x={pos.x}
                                y={pos.y + nodeSize + 6}
                                textAnchor="middle"
                                fontSize="3"
                                fill="#94a3b8"
                                opacity={hoveredNode && !isHovered && !isRelated ? 0.3 : 1}
                                className="transition-opacity duration-300 pointer-events-none"
                            >
                                {node.label.length > 12 ? node.label.slice(0, 10) + '…' : node.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Hover info panel */}
            {hoveredNode && (
                <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                    <div className="font-medium text-slate-200">
                        {nodes.find(n => n.id === hoveredNode)?.label}
                    </div>
                    <div className="text-slate-500 mt-1">
                        {visibleEdges.filter(e => e.from === hoveredNode).length} outgoing
                    </div>
                </div>
            )}
        </div>
    );
}

export const CausalGraph = memo(CausalGraphComponent);
