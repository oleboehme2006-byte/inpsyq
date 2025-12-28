'use client';

/**
 * MEASUREMENT PAGE — Minimal Employee UX
 * 
 * Rules:
 * - Mobile-first
 * - One question per screen
 * - Progress indicator only
 * - No analytics, no charts
 * - Neutral language
 */

import { useEffect, useState } from 'react';

interface MeasurementItem {
    itemId: string;
    label: string;
    scaleType: string;
    minValue: number;
    maxValue: number;
}

interface SessionData {
    session_id: string;
    status: string;
    week_start: string;
}

interface ProgressData {
    answered_count: number;
    required_count: number;
    completion_percentage: number;
    all_required_answered: boolean;
}

export default function MeasurePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [remainingItems, setRemainingItems] = useState<MeasurementItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Fetch status on mount
    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        try {
            setLoading(true);
            const res = await fetch('/api/measurement/status');
            const data = await res.json();

            if (!data.has_session) {
                setError('No active measurement session. Please wait for an invitation.');
                setLoading(false);
                return;
            }

            if (data.session.status === 'COMPLETED' || data.session.status === 'LOCKED') {
                setCompleted(true);
                setSession(data.session);
                setProgress(data.progress);
                setLoading(false);
                return;
            }

            setSession(data.session);
            setProgress(data.progress);
            setRemainingItems(data.remaining_items || []);
            setCurrentIndex(0);
            setLoading(false);
        } catch (err) {
            setError('Failed to load measurement session');
            setLoading(false);
        }
    }

    async function submitResponse(value: number) {
        if (!session || remainingItems.length === 0) return;

        const item = remainingItems[currentIndex];
        setSubmitting(true);

        try {
            const isLast = currentIndex === remainingItems.length - 1;

            const res = await fetch('/api/measurement/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.session_id,
                    responses: [{ itemId: item.itemId, value }],
                    complete: isLast,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to submit response');
                setSubmitting(false);
                return;
            }

            // Update progress
            setProgress({
                answered_count: data.answered_count,
                required_count: data.required_count,
                completion_percentage: Math.round((data.answered_count / data.required_count) * 100),
                all_required_answered: data.all_required_answered,
            });

            if (data.status === 'COMPLETED') {
                setCompleted(true);
            } else if (currentIndex < remainingItems.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // Refresh to get updated remaining items
                fetchStatus();
            }

            setSubmitting(false);
        } catch (err) {
            setError('Failed to submit response');
            setSubmitting(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center">
                    <div className="animate-pulse text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
                <div className="text-center max-w-md">
                    <div className="text-amber-400 text-lg mb-4">{error}</div>
                    <button
                        onClick={() => { setError(null); fetchStatus(); }}
                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Completed state
    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
                <div className="text-center max-w-md">
                    <div className="text-4xl mb-6">✓</div>
                    <h1 className="text-2xl font-semibold mb-4">Thank you</h1>
                    <p className="text-white/60">
                        Your responses have been recorded.
                    </p>
                </div>
            </div>
        );
    }

    // No items remaining
    if (remainingItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-4">
                <div className="text-center">
                    <div className="text-lg text-white/60">All questions answered.</div>
                </div>
            </div>
        );
    }

    const currentItem = remainingItems[currentIndex];

    // Main measurement UI
    return (
        <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
            {/* Progress bar */}
            <div className="p-4">
                <div className="flex items-center justify-between text-sm text-white/40 mb-2">
                    <span>Question {(progress?.answered_count || 0) + currentIndex + 1}</span>
                    <span>{progress?.completion_percentage || 0}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/40 transition-all duration-300"
                        style={{
                            width: `${((progress?.answered_count || 0) + currentIndex + 1) / (progress?.required_count || 10) * 100}%`
                        }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center">
                    <h2 className="text-xl md:text-2xl font-medium mb-12 leading-relaxed">
                        {currentItem.label}
                    </h2>

                    {/* Likert scale */}
                    <LikertScale
                        min={currentItem.minValue}
                        max={currentItem.maxValue}
                        disabled={submitting}
                        onSelect={submitResponse}
                    />

                    <div className="mt-8 text-sm text-white/30">
                        {currentItem.minValue} = Strongly disagree • {currentItem.maxValue} = Strongly agree
                    </div>
                </div>
            </div>
        </div>
    );
}

function LikertScale({
    min,
    max,
    disabled,
    onSelect
}: {
    min: number;
    max: number;
    disabled: boolean;
    onSelect: (value: number) => void;
}) {
    const values = [];
    for (let i = min; i <= max; i++) {
        values.push(i);
    }

    return (
        <div className="flex justify-center gap-2 md:gap-4">
            {values.map(val => (
                <button
                    key={val}
                    onClick={() => onSelect(val)}
                    disabled={disabled}
                    className={`
            w-12 h-12 md:w-14 md:h-14 
            rounded-full 
            border-2 border-white/20
            text-lg font-medium
            transition-all duration-200
            ${disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-white hover:text-black hover:border-white cursor-pointer'
                        }
          `}
                >
                    {val}
                </button>
            ))}
        </div>
    );
}
