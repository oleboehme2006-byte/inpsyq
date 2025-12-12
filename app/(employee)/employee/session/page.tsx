'use client';
import { useState, useEffect } from 'react';
import BrandLogo from '@/components/shared/BrandLogo';

export default function SessionPage() {
    const [step, setStep] = useState<'loading' | 'interaction' | 'completed'>('loading');
    const [interaction, setInteraction] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [response, setResponse] = useState('');

    // Minimal "Auth" Mock
    const userId = "00000000-0000-0000-0000-000000000001"; // Should be retrieved dynamically

    useEffect(() => {
        // Start session on mount
        fetch('/api/session/start', {
            method: 'POST',
            body: JSON.stringify({ userId })
        })
            .then(res => res.json())
            .then(data => {
                setInteraction(data.interaction);
                setSessionId(data.sessionId);
                setStep('interaction');
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!response) return;

        setStep('loading');
        await fetch('/api/session/submit', {
            method: 'POST',
            body: JSON.stringify({
                sessionId,
                interactionId: interaction.interaction_id,
                responseText: response,
                userId
            })
        });
        setStep('completed');
    };

    if (step === 'loading') return <div className="p-8">Loading...</div>;

    if (step === 'completed') return (
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-light mb-4">Session Completed</h2>
            <p className="text-gray-600">Your signal has been encoded.</p>
            <a href="/employee" className="mt-8 text-black underline">Return Home</a>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="mb-12">
                <BrandLogo />
            </header>

            <main className="max-w-xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 block">
                        {interaction?.type}
                    </span>
                    <h2 className="text-2xl font-medium mb-8">
                        {interaction?.prompt_text}
                    </h2>

                    <textarea
                        className="w-full border border-gray-200 rounded-lg p-4 h-32 mb-6 focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Type your response..."
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                    />

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition"
                    >
                        Submit Signal
                    </button>
                </div>
            </main>
        </div>
    );
}
