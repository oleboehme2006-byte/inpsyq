'use client';
/**
 * Employee Session Page
 * 
 * Production-ready session flow for EMPLOYEE users.
 * Features: auth-integration, autosave, progress indicator, test selectors.
 */

import { useState, useEffect, useCallback } from 'react';
import BrandLogo from '@/components/shared/BrandLogo';

type InteractionType = 'slider' | 'rating' | 'choice' | 'text' | 'dialog';

interface Interaction {
    interaction_id: string;
    type: InteractionType;
    prompt_text: string;
}

interface SessionData {
    sessionId: string;
    interactions: Interaction[];
}

interface ResponsePayload {
    interaction_id: string;
    raw_input: string;
}

interface StatusData {
    hasActive: boolean;
    isSubmitted: boolean;
    weekStart: string;
    draft?: {
        sessionId: string;
        interactions: Array<{
            interactionId: string;
            type: string;
            promptText: string;
            response: string | null;
        }>;
    };
}

const STORAGE_KEY_PREFIX = 'inpsyq_session_draft_';

export default function EmployeeSessionPage() {
    const [status, setStatus] = useState<'loading' | 'ready' | 'active' | 'submitting' | 'complete' | 'error'>('loading');
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<ResponsePayload[]>([]);
    const [currentValue, setCurrentValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [statusData, setStatusData] = useState<StatusData | null>(null);

    // Get storage key (without auth context since we're client-side)
    const getStorageKey = useCallback(() => {
        return `${STORAGE_KEY_PREFIX}v1`;
    }, []);

    // Load saved progress from localStorage
    const loadDraft = useCallback(() => {
        try {
            const key = getStorageKey();
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.responses) {
                    setResponses(parsed.responses);
                    setCurrentIndex(parsed.currentIndex || 0);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load draft:', e);
        }
        return null;
    }, [getStorageKey]);

    // Save progress to localStorage
    const saveDraft = useCallback((newResponses: ResponsePayload[], idx: number) => {
        try {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify({
                responses: newResponses,
                currentIndex: idx,
                savedAt: new Date().toISOString(),
            }));
        } catch (e) {
            console.warn('Failed to save draft:', e);
        }
    }, [getStorageKey]);

    // Clear draft on successful submit
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(getStorageKey());
        } catch (e) {
            console.warn('Failed to clear draft:', e);
        }
    }, [getStorageKey]);

    // Check session status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/session/status');
                if (!res.ok) throw new Error('Failed to check status');
                const data = await res.json();
                setStatusData(data);

                if (data.isSubmitted) {
                    setStatus('complete');
                } else {
                    // Load any saved draft
                    loadDraft();
                    setStatus('ready');
                }
            } catch (e: any) {
                console.error(e);
                // Assume ready state if we can't check
                loadDraft();
                setStatus('ready');
            }
        };
        checkStatus();
    }, [loadDraft]);

    const startSession = async () => {
        setStatus('loading');
        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // Server will use auth context
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to start session');
            }

            const data = await res.json();
            setSessionData(data);
            setStatus('active');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message || 'Could not start session');
        }
    };

    const handleNext = () => {
        if (!sessionData) return;

        const current = sessionData.interactions[currentIndex];
        const newResponse: ResponsePayload = {
            interaction_id: current.interaction_id,
            raw_input: currentValue,
        };

        const updated = [...responses, newResponse];
        const nextIndex = currentIndex + 1;

        setResponses(updated);
        setCurrentValue('');
        saveDraft(updated, nextIndex);

        if (nextIndex < sessionData.interactions.length) {
            setCurrentIndex(nextIndex);
        } else {
            submitSession(updated);
        }
    };

    const submitSession = async (finalResponses: ResponsePayload[]) => {
        if (!sessionData) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/session/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionData.sessionId,
                    responses: finalResponses,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit');
            }

            clearDraft();
            setStatus('complete');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message || 'Submission failed. Please try again.');
        }
    };

    // ─────────────────────────────────────────────────────────────────
    // Render: Loading
    // ─────────────────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center" data-testid="session-page">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Render: Error
    // ─────────────────────────────────────────────────────────────────
    if (status === 'error') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8" data-testid="session-page">
                <div className="max-w-md text-center" data-testid="session-error">
                    <h2 className="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
                    <p className="text-slate-400 mb-6">{errorMsg}</p>
                    <button
                        onClick={() => setStatus('ready')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Render: Complete
    // ─────────────────────────────────────────────────────────────────
    if (status === 'complete') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8" data-testid="session-page">
                <div className="max-w-md text-center" data-testid="session-success">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Session Submitted</h2>
                    <p className="text-slate-400 mb-2">
                        Thank you for your responses.
                    </p>
                    <p className="text-sm text-slate-500">
                        Week: {statusData?.weekStart || 'Current'}
                    </p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Render: Ready (Start CTA)
    // ─────────────────────────────────────────────────────────────────
    if (status === 'ready') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8" data-testid="session-page">
                <div className="max-w-md text-center">
                    <BrandLogo />
                    <h1 className="text-2xl font-semibold text-white mt-8 mb-4">Weekly Check-in</h1>
                    <p className="text-slate-400 mb-8">
                        Take a few minutes to share how your week has been.
                    </p>
                    <button
                        onClick={startSession}
                        data-testid="session-start"
                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-xl transition-colors"
                    >
                        Start Session
                    </button>
                    {responses.length > 0 && (
                        <p className="mt-4 text-sm text-slate-500">
                            Saved progress: {responses.length} responses
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Render: Active (Questions)
    // ─────────────────────────────────────────────────────────────────
    if (status === 'active' && sessionData) {
        const current = sessionData.interactions[currentIndex];
        const progress = `${currentIndex + 1}/${sessionData.interactions.length}`;
        const isLast = currentIndex === sessionData.interactions.length - 1;

        return (
            <div className="min-h-screen bg-slate-950 p-8" data-testid="session-page">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-12">
                        <BrandLogo />
                        <span className="text-sm text-slate-400" data-testid="session-progress">
                            {progress}
                        </span>
                    </header>

                    {/* Progress bar */}
                    <div className="h-1 bg-slate-800 rounded-full mb-12 overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${((currentIndex + 1) / sessionData.interactions.length) * 100}%` }}
                        />
                    </div>

                    {/* Question */}
                    <div
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8"
                        data-testid={`session-question-${currentIndex}`}
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 block">
                            {current.type}
                        </span>
                        <h2 className="text-xl font-medium text-white mb-6">
                            {current.prompt_text}
                        </h2>

                        <textarea
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            placeholder="Share your thoughts..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[120px] resize-none"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleNext}
                            disabled={!currentValue.trim() || isSubmitting}
                            data-testid={isLast ? 'session-submit' : 'session-next'}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting...
                                </>
                            ) : isLast ? (
                                'Submit'
                            ) : (
                                'Next'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Submitting state
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center" data-testid="session-page">
            <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-400">Submitting your responses...</p>
            </div>
        </div>
    );
}
