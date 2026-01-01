import React, { useState } from 'react';
import { RecommendAction } from '@/services/decision/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionCardProps {
    action: RecommendAction;
}

export default function ActionCard({ action }: ActionCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `Title: ${action.title}\nDescription: ${action.description}\nRationale: ${action.rationale}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            {/* Top Highlight Bar */}
            <div className={`absolute top-0 left-0 w-full h-1 ${action.urgency === 'IMMEDIATE' ? 'bg-rose-500' :
                action.urgency === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${action.urgency === 'IMMEDIATE' ? 'bg-rose-500 text-white' :
                        action.urgency === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                        }`}>
                        {action.urgency} Priority
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    {copied ? 'Copied!' : 'Export Brief'}
                </button>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{action.title}</h3>
            <p className="text-slate-300 mb-6 leading-relaxed">{action.description}</p>

            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Why this action?</div>
                <p className="text-sm text-slate-400 italic">&quot;{action.rationale}&quot;</p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-xs font-bold text-slate-500 uppercase mb-3">Next Steps Checklist</div>
                <div className="text-gray-400 text-xs mt-1">
                    Typically initiated when specific &quot;triggers&quot; or &quot;thresholds&quot; are met.
                </div>
                <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                        <input type="checkbox" className="mt-1 rounded border-slate-600 bg-slate-800" />
                        <span>Schedule 30-min session with key stakeholders.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                        <input type="checkbox" className="mt-1 rounded border-slate-600 bg-slate-800" />
                        <span>Review recent feedback logs for context.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-300">
                        <input type="checkbox" className="mt-1 rounded border-slate-600 bg-slate-800" />
                        <span>Draft generic communication template (verify with HR).</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
