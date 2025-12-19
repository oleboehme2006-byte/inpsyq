'use client';

import React from 'react';

interface DecisionBlockProps {
    question: string;
    children?: React.ReactNode;
    loading?: boolean;
    error?: string;
    className?: string;
}

export default function DecisionBlock({ question, children, loading, error, className = '' }: DecisionBlockProps) {
    return (
        <div className={`bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
            {/* Question Header */}
            <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-800/30">
                <h3 className="text-sm font-medium text-slate-300 tracking-wide">{question}</h3>
            </div>

            {/* Content */}
            <div className="p-5">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-800 rounded w-1/4 mt-4"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-sm">
                        <span className="font-semibold">Error:</span> {error}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-8 text-slate-500 italic text-sm">
            {message}
        </div>
    );
}
