'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock } from 'lucide-react';

// ==========================================
// Types
// ==========================================

export interface InterpretationData {
    summary: string;
    generatedAt: string;
    mode: string;
    weekRange: string;
}

export interface InterpretationPanelProps {
    interpretation?: InterpretationData;
}

// ==========================================
// InterpretationPanel Component
// Used by Team dashboard pages
// ==========================================

export const InterpretationPanel: React.FC<InterpretationPanelProps> = ({ interpretation }) => {
    if (!interpretation) return null;

    // Split summary into paragraphs
    const paragraphs = interpretation.summary.split('\n\n').filter(p => p.trim());

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-meta" />
                    <span className="text-sm font-medium text-text-secondary">
                        {interpretation.mode === 'llm' ? 'AI-Generated' : 'System'} Interpretation
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <Clock className="w-4 h-4" />
                    <span>{interpretation.weekRange}</span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm text-text-secondary leading-relaxed">
                        {paragraph}
                    </p>
                ))}
            </div>
        </motion.div>
    );
};

export default InterpretationPanel;
