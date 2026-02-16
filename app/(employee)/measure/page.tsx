'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface UISpec {
    min_label?: string;
    max_label?: string;
    choices?: string[];
    option_codes?: Record<string, any[]>;
    interpretation_hint?: string;
    construct?: string;
    guidance?: string;
    original_text?: string;
    voice_rewrite?: boolean;
}

interface Interaction {
    interaction_id: string;
    type: 'rating' | 'choice' | 'text' | 'slider' | 'dialog';
    prompt_text: string;
    parameter_targets?: string[];
}

interface ParsedInteraction {
    id: string;
    type: string;
    displayText: string;
    uiSpec: UISpec;
    rawPromptText: string;
}

interface SessionData {
    sessionId: string;
    interactions: Interaction[];
    meta: {
        request_id: string;
        duration_ms: number;
        final_count: number;
        selector_mode: string;
        is_llm: boolean;
        padded: boolean;
        [key: string]: any;
    };
    llm_used: boolean;
    question_count: number;
}

type Phase = 'loading' | 'ready' | 'active' | 'submitting' | 'complete' | 'already-done' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function parseInteraction(interaction: Interaction): ParsedInteraction {
    const raw = interaction.prompt_text;
    const separatorIndex = raw.indexOf('|||');

    let displayText = raw.trim();
    let uiSpec: UISpec = {};

    if (separatorIndex !== -1) {
        displayText = raw.substring(0, separatorIndex).trim();
        try {
            uiSpec = JSON.parse(raw.substring(separatorIndex + 3).trim());
        } catch {
            // Fallback: no spec
        }
    }

    return {
        id: interaction.interaction_id,
        type: interaction.type,
        displayText,
        uiSpec,
        rawPromptText: raw,
    };
}

/**
 * Get the authenticated user ID.
 * In dev mode, reads from the inpsyq_dev_user cookie.
 * The API calls use X-DEV-USER-ID header for authentication.
 */
function getDevUserId(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/inpsyq_dev_user=([^;]+)/);
    return match?.[1] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function MeasurePage() {
    const [phase, setPhase] = useState<Phase>('loading');
    const [error, setError] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [parsedInteractions, setParsedInteractions] = useState<ParsedInteraction[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const userId = useRef<string | null>(null);

    // ─────────────────────────────────────────────────────────────
    // On mount: check status & determine phase
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        userId.current = getDevUserId();
        if (!userId.current) {
            setError('No user ID found. Please ensure you are logged in.');
            setPhase('error');
            return;
        }
        checkStatus();
    }, []);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/session/status', {
                headers: {
                    'X-DEV-USER-ID': userId.current!,
                },
            });

            if (!res.ok) {
                // If 403/401, the user may not have EMPLOYEE role — that's okay, we skip status
                if (res.status === 403 || res.status === 401) {
                    setPhase('ready');
                    return;
                }
                throw new Error(`Status check failed: ${res.status}`);
            }

            const data = await res.json();

            if (data.isSubmitted) {
                setPhase('already-done');
            } else if (data.hasActive && data.draft) {
                // Resume existing session
                const parsed = data.draft.interactions.map((i: any) => parseInteraction({
                    interaction_id: i.interactionId,
                    type: i.type,
                    prompt_text: i.promptText,
                }));
                setSessionData({
                    sessionId: data.draft.sessionId,
                    interactions: data.draft.interactions,
                    meta: {} as any,
                    llm_used: false,
                    question_count: parsed.length,
                });
                setParsedInteractions(parsed);

                // Pre-fill existing answers
                const existingAnswers = new Map<string, string | number>();
                let firstUnanswered = 0;
                data.draft.interactions.forEach((i: any, idx: number) => {
                    if (i.response !== null) {
                        existingAnswers.set(i.interactionId, i.response);
                    } else if (firstUnanswered === idx) {
                        firstUnanswered = idx;
                    }
                });
                setAnswers(existingAnswers);
                setCurrentIndex(firstUnanswered);
                setPhase('active');
            } else {
                setPhase('ready');
            }
        } catch (err: any) {
            console.error('[Measure] Status check error:', err);
            // Don't block — allow starting fresh
            setPhase('ready');
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Start session
    // ─────────────────────────────────────────────────────────────
    const startSession = useCallback(async () => {
        setPhase('loading');
        setError(null);

        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-DEV-USER-ID': userId.current!,
                },
                body: JSON.stringify({ userId: userId.current }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || `Session start failed: ${res.status}`);
            }

            const data: SessionData = await res.json();
            setSessionData(data);

            const parsed = data.interactions.map(parseInteraction);
            setParsedInteractions(parsed);
            setCurrentIndex(0);
            setAnswers(new Map());
            setPhase('active');

        } catch (err: any) {
            console.error('[Measure] Session start error:', err);
            setError(err.message);
            setPhase('error');
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Answer handling
    // ─────────────────────────────────────────────────────────────
    const setAnswer = useCallback((interactionId: string, value: string | number) => {
        setAnswers(prev => {
            const next = new Map(prev);
            next.set(interactionId, value);
            return next;
        });
    }, []);

    const goNext = useCallback(() => {
        if (currentIndex < parsedInteractions.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        }
    }, [currentIndex, parsedInteractions.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setIsTransitioning(false);
            }, 300);
        }
    }, [currentIndex]);

    // ─────────────────────────────────────────────────────────────
    // Submit all responses
    // ─────────────────────────────────────────────────────────────
    const submitSession = useCallback(async () => {
        if (!sessionData) return;
        setPhase('submitting');

        try {
            const responses = parsedInteractions.map(pi => ({
                interaction_id: pi.id,
                raw_input: String(answers.get(pi.id) ?? ''),
            }));

            const res = await fetch('/api/session/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-DEV-USER-ID': userId.current!,
                },
                body: JSON.stringify({
                    sessionId: sessionData.sessionId,
                    userId: userId.current,
                    responses,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || `Submit failed: ${res.status}`);
            }

            const result = await res.json();
            setSubmitResult(result);
            setPhase('complete');

        } catch (err: any) {
            console.error('[Measure] Submit error:', err);
            setError(err.message);
            setPhase('error');
        }
    }, [sessionData, parsedInteractions, answers]);

    // ─────────────────────────────────────────────────────────────
    // Computed
    // ─────────────────────────────────────────────────────────────
    const current = parsedInteractions[currentIndex];
    const progress = parsedInteractions.length > 0
        ? ((currentIndex + 1) / parsedInteractions.length) * 100
        : 0;
    const answeredCount = answers.size;
    const totalCount = parsedInteractions.length;
    const allAnswered = answeredCount === totalCount && totalCount > 0;
    const isLastQuestion = currentIndex === parsedInteractions.length - 1;
    const currentAnswer = current ? answers.get(current.id) : undefined;

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    return (
        <div style={styles.container}>
            {/* Background gradient orb */}
            <div style={styles.bgOrb} />
            <div style={styles.bgOrb2} />

            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logo}>
                    <InPsyqLogo size="sm" />
                </div>
                <span style={styles.headerSub}>Weekly Pulse Check</span>
            </header>

            {/* Main content area */}
            <main style={styles.main}>
                {phase === 'loading' && <LoadingState />}
                {phase === 'ready' && <ReadyState onStart={startSession} />}
                {phase === 'active' && current && (
                    <ActiveState
                        current={current}
                        currentIndex={currentIndex}
                        totalCount={totalCount}
                        progress={progress}
                        currentAnswer={currentAnswer}
                        isLastQuestion={isLastQuestion}
                        allAnswered={allAnswered}
                        isTransitioning={isTransitioning}
                        onAnswer={(val) => setAnswer(current.id, val)}
                        onNext={goNext}
                        onPrev={goPrev}
                        onSubmit={submitSession}
                    />
                )}
                {phase === 'submitting' && <SubmittingState />}
                {phase === 'complete' && <CompleteState result={submitResult} />}
                {phase === 'already-done' && <AlreadyDoneState />}
                {phase === 'error' && <ErrorState message={error} onRetry={() => setPhase('ready')} />}
            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function LoadingState() {
    return (
        <div style={styles.centerCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Preparing your session…</p>
            <p style={styles.loadingSubText}>Building personalized questions</p>
        </div>
    );
}

function ReadyState({ onStart }: { onStart: () => void }) {
    return (
        <div style={styles.centerCard}>
            <div style={styles.readyIcon}>🧠</div>
            <h1 style={styles.readyTitle}>Weekly Pulse Check</h1>
            <p style={styles.readyDesc}>
                Share how you're feeling this week. Your responses are confidential and
                help build a healthier workplace.
            </p>
            <ul style={styles.readyInfo}>
                <li>⏱ Takes about 3–5 minutes</li>
                <li>📊 10 questions, tailored to you</li>
                <li>🔒 Responses are anonymous and encrypted</li>
            </ul>
            <button style={styles.startBtn} onClick={onStart}>
                Begin Session
            </button>
        </div>
    );
}

function ActiveState({
    current,
    currentIndex,
    totalCount,
    progress,
    currentAnswer,
    isLastQuestion,
    allAnswered,
    isTransitioning,
    onAnswer,
    onNext,
    onPrev,
    onSubmit,
}: {
    current: ParsedInteraction;
    currentIndex: number;
    totalCount: number;
    progress: number;
    currentAnswer: string | number | undefined;
    isLastQuestion: boolean;
    allAnswered: boolean;
    isTransitioning: boolean;
    onAnswer: (val: string | number) => void;
    onNext: () => void;
    onPrev: () => void;
    onSubmit: () => void;
}) {
    return (
        <div style={styles.activeContainer}>
            {/* Progress bar */}
            <div style={styles.progressContainer}>
                <div style={styles.progressTrack}>
                    <div
                        style={{
                            ...styles.progressFill,
                            width: `${progress}%`,
                        }}
                    />
                </div>
                <span style={styles.progressLabel}>
                    {currentIndex + 1} / {totalCount}
                </span>
            </div>

            {/* Question card */}
            <div
                style={{
                    ...styles.questionCard,
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
                }}
            >
                <div style={styles.questionType}>
                    {getTypeLabel(current.type)}
                </div>

                <h2 style={styles.questionText}>{current.displayText}</h2>

                {/* Input based on type */}
                <div style={styles.inputArea}>
                    {(current.type === 'rating' || current.type === 'slider') && (
                        <RatingInput
                            value={currentAnswer as number | undefined}
                            onChange={onAnswer}
                            minLabel={current.uiSpec.min_label || 'Strongly Disagree'}
                            maxLabel={current.uiSpec.max_label || 'Strongly Agree'}
                        />
                    )}
                    {current.type === 'choice' && (
                        <ChoiceInput
                            value={currentAnswer as string | undefined}
                            onChange={onAnswer}
                            choices={current.uiSpec.choices || []}
                        />
                    )}
                    {(current.type === 'text' || current.type === 'dialog') && (
                        <TextInput
                            value={currentAnswer as string | undefined}
                            onChange={onAnswer}
                            hint={current.uiSpec.interpretation_hint || current.uiSpec.guidance || ''}
                        />
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div style={styles.navRow}>
                <button
                    style={{
                        ...styles.navBtn,
                        opacity: currentIndex === 0 ? 0.3 : 1,
                    }}
                    disabled={currentIndex === 0}
                    onClick={onPrev}
                >
                    ← Back
                </button>

                {isLastQuestion && allAnswered ? (
                    <button style={styles.submitBtn} onClick={onSubmit}>
                        Submit All →
                    </button>
                ) : (
                    <button
                        style={{
                            ...styles.navBtnPrimary,
                            opacity: currentAnswer === undefined ? 0.4 : 1,
                        }}
                        disabled={currentAnswer === undefined}
                        onClick={onNext}
                    >
                        {isLastQuestion ? 'Review' : 'Next →'}
                    </button>
                )}
            </div>
        </div>
    );
}

function RatingInput({
    value,
    onChange,
    minLabel,
    maxLabel,
}: {
    value: number | undefined;
    onChange: (val: number) => void;
    minLabel: string;
    maxLabel: string;
}) {
    const scale = [1, 2, 3, 4, 5];

    return (
        <div style={styles.ratingContainer}>
            <div style={styles.ratingLabels}>
                <span style={styles.ratingLabelText}>{minLabel}</span>
                <span style={styles.ratingLabelText}>{maxLabel}</span>
            </div>
            <div style={styles.ratingButtons}>
                {scale.map((n) => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        style={{
                            ...styles.ratingBtn,
                            ...(value === n ? styles.ratingBtnActive : {}),
                        }}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ChoiceInput({
    value,
    onChange,
    choices,
}: {
    value: string | undefined;
    onChange: (val: string) => void;
    choices: string[];
}) {
    return (
        <div style={styles.choiceContainer}>
            {choices.map((choice, idx) => (
                <button
                    key={idx}
                    onClick={() => onChange(choice)}
                    style={{
                        ...styles.choiceBtn,
                        ...(value === choice ? styles.choiceBtnActive : {}),
                    }}
                >
                    {choice}
                </button>
            ))}
        </div>
    );
}

function TextInput({
    value,
    onChange,
    hint,
}: {
    value: string | undefined;
    onChange: (val: string) => void;
    hint: string;
}) {
    return (
        <div style={styles.textContainer}>
            <textarea
                style={styles.textArea}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={hint || 'Share your thoughts…'}
                rows={4}
            />
        </div>
    );
}

function SubmittingState() {
    return (
        <div style={styles.centerCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Submitting your responses…</p>
            <p style={styles.loadingSubText}>Processing through our analysis pipeline</p>
        </div>
    );
}

function CompleteState({ result }: { result: any }) {
    return (
        <div style={styles.centerCard}>
            <div style={styles.completeIcon}>✓</div>
            <h1 style={styles.completeTitle}>Session Complete</h1>
            <p style={styles.completeDesc}>
                Thank you for sharing your perspective this week. Your responses have
                been securely processed and will contribute to your team's wellbeing insights.
            </p>
            {result && (
                <div style={styles.completeMeta}>
                    <span>{result.processed} responses processed</span>
                    <span>•</span>
                    <span>{result.duration_ms}ms</span>
                </div>
            )}
        </div>
    );
}

function AlreadyDoneState() {
    return (
        <div style={styles.centerCard}>
            <div style={styles.doneIcon}>📋</div>
            <h1 style={styles.readyTitle}>Already Completed</h1>
            <p style={styles.readyDesc}>
                You've already submitted your pulse check for this week.
                Check back next week for a new set of questions.
            </p>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
    return (
        <div style={styles.centerCard}>
            <div style={styles.errorIcon}>⚠</div>
            <h1 style={styles.errorTitle}>Something went wrong</h1>
            <p style={styles.errorDesc}>{message || 'An unexpected error occurred.'}</p>
            <button style={styles.startBtn} onClick={onRetry}>
                Try Again
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function getTypeLabel(type: string): string {
    switch (type) {
        case 'rating':
        case 'slider':
            return 'Rate your agreement';
        case 'choice':
            return 'Select one option';
        case 'text':
        case 'dialog':
            return 'Share your thoughts';
        default:
            return 'Question';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Inline Styles (dark neon theme matching design system)
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    bgOrb: {
        position: 'fixed',
        top: '-30%',
        right: '-20%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    bgOrb2: {
        position: 'fixed',
        bottom: '-20%',
        left: '-15%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    header: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    logo: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '1px',
        fontSize: '20px',
        fontWeight: 700,
        letterSpacing: '-0.5px',
    },
    logoIn: {
        color: '#A1A1AA',
    },
    logoPsyq: {
        color: '#FFFFFF',
    },
    headerSub: {
        fontSize: '13px',
        color: '#52525B',
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
    },

    main: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 72px)',
        padding: '24px',
    },

    // Center card (loading, ready, complete, error, already-done)
    centerCard: {
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center' as const,
        padding: '48px 40px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
    },

    // Loading
    spinner: {
        width: '40px',
        height: '40px',
        margin: '0 auto 24px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#8B5CF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        fontSize: '18px',
        fontWeight: 500,
        color: '#FFFFFF',
        marginBottom: '8px',
    },
    loadingSubText: {
        fontSize: '14px',
        color: '#52525B',
    },

    // Ready
    readyIcon: {
        fontSize: '48px',
        marginBottom: '24px',
    },
    readyTitle: {
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '12px',
        letterSpacing: '-0.5px',
    },
    readyDesc: {
        fontSize: '15px',
        color: '#A1A1AA',
        lineHeight: 1.6,
        marginBottom: '24px',
    },
    readyInfo: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 32px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        textAlign: 'left' as const,
        fontSize: '14px',
        color: '#A1A1AA',
    },
    startBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 40px',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '-0.2px',
        transition: 'all 0.2s ease',
        boxShadow: '0 0 24px rgba(139,92,246,0.3)',
    },

    // Active session
    activeContainer: {
        maxWidth: '640px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },

    // Progress
    progressContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    progressTrack: {
        flex: 1,
        height: '4px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%)',
        borderRadius: '4px',
        transition: 'width 0.4s ease',
    },
    progressLabel: {
        fontSize: '13px',
        color: '#52525B',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap' as const,
    },

    // Question card
    questionCard: {
        padding: '40px 36px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
    },
    questionType: {
        fontSize: '12px',
        color: '#8B5CF6',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        fontWeight: 600,
        marginBottom: '16px',
    },
    questionText: {
        fontSize: '20px',
        fontWeight: 500,
        lineHeight: 1.5,
        marginBottom: '32px',
        letterSpacing: '-0.3px',
    },
    inputArea: {
        // Wrapper
    },

    // Rating input
    ratingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    ratingLabels: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    ratingLabelText: {
        fontSize: '12px',
        color: '#52525B',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    ratingButtons: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
    },
    ratingBtn: {
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        color: '#A1A1AA',
        fontSize: '18px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    ratingBtnActive: {
        background: 'rgba(139,92,246,0.15)',
        borderColor: '#8B5CF6',
        color: '#FFFFFF',
        boxShadow: '0 0 16px rgba(139,92,246,0.2)',
    },

    // Choice input
    choiceContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    choiceBtn: {
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#A1A1AA',
        fontSize: '15px',
        textAlign: 'left' as const,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    choiceBtnActive: {
        background: 'rgba(139,92,246,0.12)',
        borderColor: '#8B5CF6',
        color: '#FFFFFF',
    },

    // Text input
    textContainer: {
        width: '100%',
    },
    textArea: {
        width: '100%',
        padding: '16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontSize: '15px',
        lineHeight: 1.6,
        fontFamily: "'Inter', system-ui, sans-serif",
        resize: 'vertical' as const,
        outline: 'none',
        minHeight: '120px',
    },

    // Navigation
    navRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
    },
    navBtn: {
        padding: '12px 24px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#A1A1AA',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    navBtnPrimary: {
        padding: '12px 28px',
        background: 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '10px',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    submitBtn: {
        padding: '14px 32px',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 0 24px rgba(139,92,246,0.3)',
        transition: 'all 0.2s ease',
    },

    // Complete
    completeIcon: {
        width: '64px',
        height: '64px',
        margin: '0 auto 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)',
        border: '2px solid rgba(34,197,94,0.3)',
        color: '#22C55E',
        fontSize: '28px',
        fontWeight: 700,
    },
    completeTitle: {
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '12px',
        letterSpacing: '-0.5px',
    },
    completeDesc: {
        fontSize: '15px',
        color: '#A1A1AA',
        lineHeight: 1.6,
        marginBottom: '20px',
    },
    completeMeta: {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#52525B',
    },

    // Already done
    doneIcon: {
        fontSize: '48px',
        marginBottom: '24px',
    },

    // Error
    errorIcon: {
        fontSize: '48px',
        marginBottom: '24px',
    },
    errorTitle: {
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '12px',
        color: '#EF4444',
    },
    errorDesc: {
        fontSize: '15px',
        color: '#A1A1AA',
        lineHeight: 1.6,
        marginBottom: '24px',
    },
};
