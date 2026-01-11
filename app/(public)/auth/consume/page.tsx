'use client';

/**
 * AUTH CONSUME CONFIRM PAGE
 * 
 * Human-confirmation page for magic link login.
 * Scanners can GET this page without consuming the token.
 * Token is only consumed when user clicks "Continue" (POST).
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="consume-page">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
        </div>
    );
}

function ConsumeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');
    const [error, setError] = useState<string | null>(null);

    // If no token, show missing token message
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="consume-page">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center" data-testid="consume-missing-token">
                    <h1 className="text-xl font-semibold text-slate-900 mb-4">Missing Token</h1>
                    <p className="text-slate-600 mb-6">
                        This login link appears to be incomplete. Please request a new one.
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    async function handleContinue() {
        setStatus('loading');
        setError(null);

        try {
            const res = await fetch('/api/auth/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (data.ok && data.redirectTo) {
                // Success - redirect
                window.location.href = data.redirectTo;
            } else {
                // Error
                setStatus('error');
                setError(data.error?.message || 'Login failed. Please request a new link.');
            }
        } catch (e: any) {
            setStatus('error');
            setError('Network error. Please try again.');
        }
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="consume-page">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center" data-testid="consume-error">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 mb-2">Login Failed</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <a
                        href="/login"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Request New Link
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="consume-page">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">Log in to InPsyq</h1>
                <p className="text-slate-600 mb-8">
                    Click the button below to complete your login.
                </p>
                <button
                    onClick={handleContinue}
                    disabled={status === 'loading'}
                    data-testid="consume-continue"
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging in...
                        </span>
                    ) : (
                        'Continue to InPsyq'
                    )}
                </button>
                <p className="text-xs text-slate-400 mt-6">
                    Secure login link. This link can only be used once.
                </p>
            </div>
        </div>
    );
}

export default function ConsumeConfirmPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ConsumeContent />
        </Suspense>
    );
}
