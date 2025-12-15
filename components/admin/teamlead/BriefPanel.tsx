import React, { useState } from 'react';
import { BriefOutput } from '@/services/llm/types';

interface Props {
    orgId: string;
    teamId: string;
    weekStart: string;
}

export default function BriefPanel({ orgId, teamId, weekStart }: Props) {
    const [loading, setLoading] = useState(false);
    const [brief, setBrief] = useState<BriefOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const generateBrief = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/brief?org_id=${orgId}&team_id=${teamId}&week_start=${weekStart}`);
            if (!res.ok) throw new Error("Failed to generate brief");
            const data = await res.json();
            setBrief(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!brief) return;
        const text = `# ${brief.headline}\n\n${brief.state_summary}\n\n${brief.trend_summary}`;
        navigator.clipboard.writeText(text);
        alert("Brief copied!");
    };

    return (
        <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 p-32 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Executive Narrative
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        AI-synthesized brief based on deterministic core data.
                    </p>
                </div>
                {!brief && (
                    <button
                        onClick={generateBrief}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin text-lg">⟳</span> Writing...
                            </>
                        ) : (
                            <>Generate Brief</>
                        )}
                    </button>
                )}
                {brief && (
                    <div className="flex gap-2">
                        <button
                            onClick={generateBrief}
                            className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                            Regenerate
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                        >
                            Copy Brief
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}

            {brief && (
                <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-lg">
                        <h3 className="text-2xl font-serif text-white mb-4 leading-tight">
                            "{brief.headline}"
                        </h3>
                        <div className="space-y-4 text-slate-300 leading-relaxed max-w-4xl">
                            <p><span className="text-purple-400 font-bold">Situation:</span> {brief.state_summary}</p>
                            <p><span className="text-purple-400 font-bold">Trend:</span> {brief.trend_summary}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-slate-950/30 border border-slate-800 rounded-lg">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Key Drivers</h4>
                            <ul className="space-y-3">
                                {brief.top_drivers.map((d, i) => (
                                    <li key={i} className="text-sm">
                                        <div className="font-bold text-slate-200 mb-1">{d.name} <span className="text-xs font-normal text-slate-500">({d.scope})</span></div>
                                        <div className="text-slate-400">{d.why_it_matters}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-4 bg-slate-900/30 border border-indigo-900/30 rounded-lg">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Recommended Actions</h4>
                            <ul className="space-y-3">
                                {brief.influence_actions.map((a, i) => (
                                    <li key={i} className="text-sm">
                                        <div className="font-bold text-slate-200 mb-1">{a.action_title}</div>
                                        <ul className="list-disc list-inside text-slate-400 pl-2">
                                            {a.steps.map((s, j) => (
                                                <li key={j}>{s}</li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                        >
                            {expanded ? '▼' : '▶'} Explanability & Sources
                        </button>

                        {expanded && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 bg-black/20 p-4 rounded-lg">
                                <div>
                                    <strong className="block text-slate-300 mb-2">Confidence</strong>
                                    {brief.confidence_statement}
                                    <div className="mt-2 text-yellow-500/80">
                                        {brief.risks_and_watchouts.join(' ')}
                                    </div>
                                </div>
                                <div>
                                    <strong className="block text-slate-300 mb-2">Sources</strong>
                                    <ul className="space-y-1 font-mono text-[10px]">
                                        {brief.citations.map((c, i) => (
                                            <li key={i}>[{c.source}]: {c.fields_used.join(', ')}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
