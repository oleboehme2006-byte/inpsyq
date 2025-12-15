import React from 'react';
import { DecisionState } from '@/services/decision/types';
import { motion } from 'framer-motion';

interface StateCardProps {
    state: DecisionState;
}

export default function StateCard({ state }: StateCardProps) {
    const getColor = (label: string) => {
        switch (label) {
            case 'HEALTHY': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'AT_RISK': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            case 'CRITICAL': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
            default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
        }
    };

    const styles = getColor(state.label);

    return (
        <div className={`p-6 rounded-xl border ${styles} flex flex-col items-center justify-center text-center h-full`}>
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Current State</div>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black mb-2"
            >
                {state.label.replace('_', ' ')}
            </motion.div>
            <div className="text-xl font-mono font-bold mb-4">
                Health Score: {(state.score * 100).toFixed(0)}%
            </div>
            <div className="text-sm opacity-90 max-w-md">
                {state.explanation}
            </div>

            <div className="mt-4 text-xs font-mono opacity-60">
                Primary Metric: {state.primary_metric}
            </div>
        </div>
    );
}
