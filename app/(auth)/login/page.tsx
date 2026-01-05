'use client';

/**
 * LOGIN PAGE — Magic Link Login
 * 
 * Minimal login page for requesting magic link via email.
 */

import { useState, FormEvent } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/request-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setMessage('Check your email for a login link');
            } else {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please check your connection.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome to InPsyq
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Enter your email to receive a login link
                    </p>

                    {status === 'success' ? (
                        <div className="text-center py-8" data-testid="login-success">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Check your email
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                We sent a login link to <strong>{email}</strong>
                            </p>
                            <button
                                onClick={() => { setStatus('idle'); setEmail(''); }}
                                className="mt-6 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Use a different email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    disabled={status === 'loading'}
                                    required
                                    data-testid="login-email"
                                />
                            </div>

                            {status === 'error' && message && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                                data-testid="login-submit"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Login Link'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                    Access is by invitation only
                </p>
            </div>
        </div>
    );
}
