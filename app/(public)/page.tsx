'use client';
/**
 * Landing Page
 * 
 * Public-facing page with CTAs for login and demo.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { analytics } from '@/lib/analytics/track';

export default function LandingPage() {
    useEffect(() => {
        analytics.landingView();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white" data-testid="landing-page">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg" />
                    <span className="text-xl font-semibold tracking-tight">InPsyq</span>
                </div>
                <nav className="flex items-center gap-4">
                    <Link
                        href="/demo"
                        onClick={() => analytics.clickViewDemo()}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Demo
                    </Link>
                    <Link
                        href="/login"
                        onClick={() => analytics.clickRequestAccess()}
                        className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        Sign In
                    </Link>
                </nav>
            </header>

            {/* Hero */}
            <main className="px-6 pt-20 pb-32">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                        Understand Your Team&apos;s Wellbeing
                    </h1>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        InPsyq gives executives and team leads real-time psychological insights to build healthier, more productive teams.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-20">
                        <Link
                            href="/login"
                            onClick={() => analytics.clickRequestAccess()}
                            data-testid="landing-cta-login"
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors text-lg"
                        >
                            Request Access
                        </Link>
                        <Link
                            href="/demo"
                            onClick={() => analytics.clickViewDemo()}
                            data-testid="landing-cta-demo"
                            className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-lg"
                        >
                            View Demo
                        </Link>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Weekly Pulse</h3>
                            <p className="text-slate-400 text-sm">
                                Brief, non-intrusive check-ins that respect employee time while capturing meaningful signals.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Early Warnings</h3>
                            <p className="text-slate-400 text-sm">
                                Detect burnout signals and team friction before they become critical issues.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
                            <p className="text-slate-400 text-sm">
                                Individual responses are never exposed. Only aggregated, anonymized insights surface to leadership.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Team Insights</h3>
                            <p className="text-slate-400 text-sm">
                                Team leads get actionable insights specific to their team dynamics and trends.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Executive View</h3>
                            <p className="text-slate-400 text-sm">
                                Cross-organizational visibility with trend analysis and priority watchlists.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-slate-800">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-500">
                    <span>© 2026 InPsyq. All rights reserved.</span>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                        <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
