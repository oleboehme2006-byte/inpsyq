'use client';

import { useEffect, useState } from 'react';
import SliderInteraction from '@/components/session/SliderInteraction';
import ChoiceInteraction from '@/components/session/ChoiceInteraction';
import TextInteraction from '@/components/session/TextInteraction';
import { useRouter } from 'next/navigation';

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
    meta?: {
        is_llm?: boolean;
    };
}

interface ResponsePayload {
    interaction_id: string;
    raw_input: string;
}

interface Employee {
    user_id: string;
    role: string;
    team_id: string;
}

export default function SessionPage() {
    const router = useRouter();

    // Auth / Setup State
    const [userId, setUserId] = useState<string | null>(null);
    const [orgIdInput, setOrgIdInput] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [setupError, setSetupError] = useState('');

    // Session State
    const [status, setStatus] = useState<'init' | 'setup' | 'loading' | 'active' | 'submitting' | 'complete' | 'error'>('init');
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [responses, setResponses] = useState<ResponsePayload[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    // 1. Initial Load: Check LocalStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('inpsyq_user_id');
        if (storedUser) {
            setUserId(storedUser);
            startSession(storedUser);
        } else {
            setStatus('setup');
        }
    }, []);

    // 2. Fetch Employees
    const handleFetchEmployees = async () => {
        if (!orgIdInput) return;
        setLoadingEmployees(true);
        setSetupError('');
        try {
            const res = await fetch(`/api/admin/employees?org_id=${orgIdInput}`);
            if (!res.ok) throw new Error('Failed to fetch employees. Check Org ID.');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setEmployees(data);
            } else {
                setSetupError('No employees found for this Org ID.');
            }
        } catch (e: any) {
            setSetupError(e.message || 'Error fetching employees');
        } finally {
            setLoadingEmployees(false);
        }
    };

    // 3. Select User & Start
    const handleSelectUser = (id: string) => {
        localStorage.setItem('inpsyq_user_id', id);
        setUserId(id);
        startSession(id);
    };

    const handleLogout = () => {
        localStorage.removeItem('inpsyq_user_id');
        setUserId(null);
        setStatus('setup');
        setEmployees([]);
    };

    // 4. Start Session Logic
    const startSession = async (uid: string) => {
        try {
            setStatus('loading');
            const res = await fetch('/api/session/start', {
                method: 'POST',
                body: JSON.stringify({ userId: uid }),
            });

            if (res.status === 400) {
                const err = await res.json();
                throw new Error(err.error || 'Invalid User ID');
            }

            if (!res.ok) throw new Error('Failed to start session');

            const data = await res.json();
            setSessionData(data);
            setStatus('active');
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message || 'Could not start session.');
        }
    };

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
                    userId: userId,
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

    // RENDER: Setup Screen
    if (status === 'setup') {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center justify-center font-sans">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            InPsyq Session
                        </h1>
                        <p className="mt-2 text-slate-400">Employee Login</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={orgIdInput}
                                    onChange={(e) => setOrgIdInput(e.target.value)}
                                    placeholder="UUID..."
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                                />
                                <button
                                    onClick={handleFetchEmployees}
                                    disabled={!orgIdInput || loadingEmployees}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {loadingEmployees ? '...' : 'Find'}
                                </button>
                            </div>
                            {setupError && <p className="text-xs text-rose-500">{setupError}</p>}
                        </div>

                        {employees.length > 0 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Employee</label>
                                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {employees.map(emp => (
                                        <button
                                            key={emp.user_id}
                                            onClick={() => handleSelectUser(emp.user_id)}
                                            className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group"
                                        >
                                            <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                                {(emp.role || 'employee').replace(/_/g, ' ').toUpperCase()}
                                            </div>
                                            <div className="text-xs text-slate-600 font-mono mt-1 truncate">
                                                {emp.user_id}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'init' || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-pulse text-purple-400">Loading Session...</div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-rose-500">
                <p className="text-xl mb-4">{errorMsg}</p>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors"
                >
                    Reset / Login Again
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
                <div className="flex gap-4 mt-8">
                    <button
                        onClick={() => { setStatus('active'); setResponses([]); setCurrentIndex(0); startSession(userId!); }}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white transition-colors"
                    >
                        Start New Session
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 border border-gray-700 rounded hover:bg-gray-800 transition-all"
                    >
                        Return Home
                    </button>
                </div>
                <button onClick={handleLogout} className="mt-8 text-xs text-slate-600 hover:text-slate-400">
                    Logout (Clear ID)
                </button>
            </div>
        );
    }

    if (sessionData && (status === 'active' || status === 'submitting')) {
        const interaction = sessionData.interactions[currentIndex];
        const progress = ((currentIndex) / sessionData.interactions.length) * 100;

        // PARSE METADATA (smuggled via |||)
        let displayPrompt = interaction.prompt_text;
        let metadata: any = {};
        if (displayPrompt.includes('|||')) {
            const parts = displayPrompt.split('|||');
            displayPrompt = parts[0].trim();
            try {
                metadata = JSON.parse(parts[1].trim());
            } catch (e) {
                console.error('Failed to parse interaction metadata', e);
            }
        }

        return (
            <div className="min-h-screen bg-black flex flex-col">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-900">
                    <div
                        className="h-full bg-purple-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Logout/Reset Helper (Top Right) */}
                    <button onClick={handleLogout} className="absolute top-4 right-4 text-xs text-slate-700 hover:text-slate-500">
                        Reset User
                    </button>

                    {/* Debug Info (Local/Dev Only) */}
                    {process.env.NODE_ENV !== 'production' && (
                        <>
                            <div className="absolute top-4 left-4 text-xs text-slate-800 font-mono">
                                <div>ID: {interaction.interaction_id.slice(0, 8)}</div>
                                <div>Type: {interaction.type}</div>
                            </div>
                            <div className="fixed bottom-2 right-2 flex gap-2">
                                <div className="text-[10px] text-zinc-600 bg-black/10 px-2 py-1 rounded select-all">
                                    {(interaction?.prompt_text || '').split('|||')[0]} (ID: {interaction?.interaction_id})
                                </div>
                                <div className={`text-[10px] px-2 py-1 rounded font-bold ${sessionData?.meta?.is_llm ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                    {sessionData?.meta?.is_llm ? 'LLM: OPENAI' : 'LLM: FALLBACK'}
                                </div>
                            </div>
                        </>
                    )}

                    {interaction.type === 'slider' || interaction.type === 'rating' ? (
                        <SliderInteraction
                            prompt={displayPrompt}
                            meta={metadata}
                            onSubmit={handleInteractionSubmit}
                            loading={status === 'submitting'}
                        />
                    ) : interaction.type === 'choice' ? (
                        <ChoiceInteraction
                            prompt={displayPrompt}
                            meta={metadata}
                            onSubmit={handleInteractionSubmit}
                            loading={status === 'submitting'}
                        />
                    ) : (
                        <TextInteraction
                            prompt={displayPrompt}
                            meta={metadata}
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
