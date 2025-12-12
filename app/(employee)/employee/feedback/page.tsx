'use client';
import { useState } from 'react';
import BrandLogo from '@/components/shared/BrandLogo';

export default function FeedbackPage() {
    const [content, setContent] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const userId = "00000000-0000-0000-0000-000000000001"; // Mock ID

    const handleSubmit = async () => {
        await fetch('/api/feedback/private', {
            method: 'POST',
            body: JSON.stringify({ userId, content })
        });
        setSubmitted(true);
    };

    if (submitted) return (
        <div className="min-h-screen p-8 flex items-center justify-center text-center">
            <div>
                <h1 className="text-2xl mb-4">Feedback Received</h1>
                <a href="/employee" className="underline">Back</a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="mb-12">
                <BrandLogo />
            </header>
            <main className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-gray-100">
                <h2 className="text-xl mb-6">Private Feedback</h2>
                <textarea
                    className="w-full border border-gray-200 rounded-lg p-4 h-48 mb-6"
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <button
                    onClick={handleSubmit}
                    className="w-full bg-gray-900 text-white py-3 rounded-lg"
                >
                    Send Securely
                </button>
            </main>
        </div>
    );
}
