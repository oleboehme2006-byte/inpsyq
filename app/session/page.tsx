'use client';

import { useEffect, useState } from 'react';
import SliderInteraction from '@/components/session/SliderInteraction';
import ChoiceInteraction from '@/components/session/ChoiceInteraction';
import TextInteraction from '@/components/session/TextInteraction';
import { useRouter } from 'next/navigation';

// Mock User ID for Phase A2 (since we don't have Auth yet)
// This should be stable to allow checking DB State for same user.
const DEMO_USER_ID = 'demo-user-123';

// Types
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

export default function SessionPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'init' | 'loading' | 'active' | 'submitting' | 'complete' | 'error'>('init');
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<ResponsePayload[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Start Session on Mount
    useEffect(() => {
        const startSession = async () => {
            try {
                setStatus('loading');
                const res = await fetch('/api/session/start', {
                    method: 'POST',
                    body: JSON.stringify({ userId: DEMO_USER_ID }),
                });

                if (!res.ok) throw new Error('Failed to start session');

                const data = await res.json();
                setSessionData(data);
                setStatus('active');
            } catch (e) {
                console.error(e);
                setStatus('error');
                setErrorMsg('Could not start session. Please try again.');
            }
        };

        if (status === 'init') {
            startSession();
        }
    }, [status]);

    // Handle Interaction Submit
    const handleInteractionSubmit = async (value: string) => {
        if (!sessionData) return;

        const currentInteraction = sessionData.interactions[currentIndex];
        const newResponse = {
            interaction_id: currentInteraction.interaction_id,
            raw_input: value
        };

        const updatedResponses = [...responses, newResponse];
        setResponses(updatedResponses);

        // Check completion
        if (currentIndex < sessionData.interactions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // All done, submit session
            await submitSession(sessionData.sessionId, updatedResponses);
        }
    };

    const submitSession = async (sessionId: string, finalResponses: ResponsePayload[]) => {
        try {
            setStatus('submitting');
            const res = await fetch('/api/session/submit', {
                method: 'POST',
                body: JSON.stringify({
                    userId: DEMO_USER_ID,
                    sessionId,
                    responses: finalResponses
                })
            });

            if (!res.ok) throw new Error('Submission failed');

            setStatus('complete');
        } catch (e) {
            console.error(e);
            setStatus('error');
            setErrorMsg('Failed to submit responses.');
        }
    };

    if (status === 'init' || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-pulse">Loading Session...</div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-rose-500">
                <p className="text-xl mb-4">{errorMsg}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-800 rounded text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (status === 'complete') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <h1 className="text-3xl font-light mb-4 text-emerald-400">Session Complete</h1>
                <p className="text-gray-400 text-center max-w-md">
                    Thank you. Your inputs have been encrypted and processed.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-8 px-6 py-2 border border-gray-700 rounded hover:bg-gray-800 transition-all"
                >
                    Return Home
                </button>
            </div>
        );
    }

    if (sessionData && (status === 'active' || status === 'submitting')) {
        const interaction = sessionData.interactions[currentIndex];
        const progress = ((currentIndex) / sessionData.interactions.length) * 100;

        return (
            <div className="min-h-screen bg-black flex flex-col">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-900">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center">
                    {interaction.type === 'slider' || interaction.type === 'rating' ? (
                        <SliderInteraction
                            prompt={interaction.prompt_text}
                            onSubmit={handleInteractionSubmit}
                            loading={status === 'submitting'}
                        />
                    ) : interaction.type === 'choice' ? (
                        <ChoiceInteraction
                            prompt={interaction.prompt_text}
                            onSubmit={handleInteractionSubmit}
                            loading={status === 'submitting'}
                        />
                    ) : (
                        <TextInteraction
                            prompt={interaction.prompt_text}
                            onSubmit={handleInteractionSubmit}
                            loading={status === 'submitting'}
                        />
                    )}
                </div>

                <div className="p-4 text-center text-gray-600 text-xs uppercase tracking-widest">
                    InPsyq Secure Session | {currentIndex + 1} OF {sessionData.interactions.length}
                </div>
            </div>
        );
    }

    return null;
}
