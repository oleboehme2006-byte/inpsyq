'use client';

import React, { memo } from 'react';
import { safeNumber } from '@/lib/utils/safeNumber';

export interface RiskSpaceProps {
    /** Epistemic risk (data quality) 0-1 */
    epistemic: number;
    /** Ethical risk (potential harm) 0-1 */
    ethical: number;
    /** Organizational risk (business impact) 0-1 */
    organizational: number;
    /** Whether governance is blocked */
    blocked?: boolean;
    /** Height in pixels */
    height?: number;
    /** Explainability token */
    explainToken?: string;
}

/**
 * RiskSpace - Layered depth visualization of risk dimensions
 * 
 * Visual Encoding:
 * - Layer depth = risk level
 * - Transparency = certainty
 * - Frosted overlay = governance blocked
 */
function RiskSpaceComponent({
    epistemic,
    ethical,
    organizational,
    blocked = false,
    height = 120,
    explainToken,
}: RiskSpaceProps) {
    const safeEpistemic = safeNumber(epistemic);
    const safeEthical = safeNumber(ethical);
    const safeOrganizational = safeNumber(organizational);

    // Calculate visual properties
    const layers = [
        { name: 'epistemic', value: safeEpistemic, color: 'rgba(147, 51, 234, 0.6)', depth: 0 },
        { name: 'ethical', value: safeEthical, color: 'rgba(239, 68, 68, 0.6)', depth: 1 },
        { name: 'organizational', value: safeOrganizational, color: 'rgba(59, 130, 246, 0.6)', depth: 2 },
    ].sort((a, b) => b.value - a.value);

    return (
        <div
            className="relative w-full flex items-center justify-center"
            style={{ height, perspective: '400px' }}
            data-explain-token={explainToken}
        >
            {/* Risk layers */}
            <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                {layers.map((layer, i) => {
                    const size = 40 + layer.value * 60;
                    const opacity = 0.3 + layer.value * 0.5;

                    return (
                        <div
                            key={layer.name}
                            className="absolute rounded-full transition-all duration-700"
                            style={{
                                width: size,
                                height: size,
                                left: `calc(50% - ${size / 2}px)`,
                                top: `calc(50% - ${size / 2}px)`,
                                background: layer.color,
                                opacity,
                                transform: `translateZ(${(2 - i) * 15}px)`,
                                boxShadow: `0 ${i * 4}px ${i * 8}px rgba(0,0,0,0.2)`,
                            }}
                        />
                    );
                })}

                {/* Center indicator */}
                <div
                    className="absolute w-2 h-2 rounded-full bg-slate-400"
                    style={{
                        left: 'calc(50% - 4px)',
                        top: 'calc(50% - 4px)',
                        transform: 'translateZ(50px)',
                    }}
                />
            </div>

            {/* Labels */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-around text-[8px] uppercase tracking-wider text-slate-600">
                <span style={{ opacity: 0.4 + safeEpistemic * 0.6 }}>epistemic</span>
                <span style={{ opacity: 0.4 + safeEthical * 0.6 }}>ethical</span>
                <span style={{ opacity: 0.4 + safeOrganizational * 0.6 }}>org</span>
            </div>

            {/* Blocked overlay */}
            {blocked && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-light">
                        gated
                    </div>
                </div>
            )}
        </div>
    );
}

export const RiskSpace = memo(RiskSpaceComponent);
