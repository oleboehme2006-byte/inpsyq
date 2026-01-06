'use client';
/**
 * Demo Page
 * 
 * Public demo of Executive and Team dashboards using mock data only.
 * No auth required. Shows DEMO MODE banner.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { analytics } from '@/lib/analytics/track';
import {
    demoOrg,
    demoTeams,
    demoWeeklyTrends,
    demoWeekLabels,
    demoWatchlist,
    demoInterpretations,
    demoTeamDetail,
} from '@/lib/demo/demoData';

type DemoView = 'executive' | 'team';

export default function DemoPage() {
    const [view, setView] = useState<DemoView>('executive');

    useEffect(() => {
        analytics.demoView();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white" data-testid="demo-page">
            {/* Demo Mode Banner */}
            <div
                className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2 text-center"
                data-testid="demo-mode-banner"
            >
                <span className="text-amber-400 text-sm font-medium">
                    🎭 DEMO MODE — This is sample data for demonstration purposes only
                </span>
            </div>

            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-800">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg" />
                            <span className="text-xl font-semibold tracking-tight">InPsyq</span>
                        </Link>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">{demoOrg.orgName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setView('executive')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'executive'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Executive View
                            </button>
                            <button
                                onClick={() => setView('team')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'team'
                                        ? 'bg-purple-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Team View
                            </button>
                        </div>

                        <Link
                            href="/login"
                            className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    {view === 'executive' ? <ExecutiveDemo /> : <TeamDemo />}
                </div>
            </main>
        </div>
    );
}

// ============================================================================
// Executive Demo View
// ============================================================================

function ExecutiveDemo() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold mb-2">Executive Overview</h1>
                <p className="text-slate-400">
                    Week of {demoWeekLabels[demoWeekLabels.length - 1]} • {demoTeams.length} teams
                </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-medium mb-4">AI Summary</h2>
                <p className="text-slate-300 leading-relaxed">
                    {demoInterpretations.executive.summary}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                        {demoInterpretations.executive.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-purple-400">→</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Teams Grid */}
            <div>
                <h2 className="text-lg font-medium mb-4">Team Health</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {demoTeams.map((team) => (
                        <div
                            key={team.teamId}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-medium">{team.name}</h3>
                                    <p className="text-sm text-slate-400">{team.memberCount} members</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-semibold ${getHealthColor(team.healthScore)}`}>
                                        {Math.round(team.healthScore * 100)}%
                                    </div>
                                    <div className={`text-xs ${getTrendColor(team.trend)}`}>
                                        {getTrendLabel(team.trend)}
                                    </div>
                                </div>
                            </div>

                            {/* Mini Sparkline */}
                            <div className="h-10 flex items-end gap-1">
                                {demoWeeklyTrends[team.name.toLowerCase() as keyof typeof demoWeeklyTrends]?.map((val, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-purple-500/30 rounded-t"
                                        style={{ height: `${val * 100}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Watchlist */}
            <div>
                <h2 className="text-lg font-medium mb-4">Watchlist</h2>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Team</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Signal</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Severity</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Weeks Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {demoWatchlist.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium">{item.teamName}</td>
                                    <td className="px-4 py-3 text-slate-300">{item.signal}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(item.severity)}`}>
                                            {item.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">{item.weeksActive}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Team Demo View
// ============================================================================

function TeamDemo() {
    const team = demoTeamDetail;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">{team.teamName}</h1>
                    <p className="text-slate-400">
                        Week of {team.weekStart} • {team.memberCount} members • {Math.round(team.responseRate * 100)}% response rate
                    </p>
                </div>
                <div className="text-right">
                    <div className={`text-4xl font-bold ${getHealthColor(team.healthScore)}`}>
                        {Math.round(team.healthScore * 100)}%
                    </div>
                    <div className="text-sm text-slate-400">Health Score</div>
                </div>
            </div>

            {/* Interpretation */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-medium mb-4">Weekly Interpretation</h2>
                <p className="text-slate-300 leading-relaxed">
                    {team.interpretation}
                </p>
            </div>

            {/* Drivers */}
            <div>
                <h2 className="text-lg font-medium mb-4">Key Drivers</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {team.drivers.map((driver) => (
                        <div
                            key={driver.name}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-medium">{driver.name}</h3>
                                <span className={`text-xs ${driver.change > 0 ? 'text-green-400' : driver.change < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                    {driver.change > 0 ? '+' : ''}{Math.round(driver.change * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${getHealthBg(driver.score)}`}
                                        style={{ width: `${driver.score * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium">{Math.round(driver.score * 100)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* History Chart */}
            <div>
                <h2 className="text-lg font-medium mb-4">8-Week Trend</h2>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="h-40 flex items-end gap-2">
                        {team.weeklyHistory.map((week, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-purple-500/40 hover:bg-purple-500/60 rounded-t transition-colors"
                                    style={{ height: `${week.score * 100}%` }}
                                />
                                <span className="text-xs text-slate-500 mt-2 -rotate-45 origin-top-left whitespace-nowrap">
                                    {week.weekStart.slice(5)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function getHealthColor(score: number): string {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-amber-400';
    return 'text-red-400';
}

function getHealthBg(score: number): string {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-slate-400';
}

function getTrendLabel(trend: 'up' | 'down' | 'stable'): string {
    if (trend === 'up') return '↑ Improving';
    if (trend === 'down') return '↓ Declining';
    return '→ Stable';
}

function getSeverityBadge(severity: 'high' | 'medium' | 'low'): string {
    if (severity === 'high') return 'bg-red-500/20 text-red-400';
    if (severity === 'medium') return 'bg-amber-500/20 text-amber-400';
    return 'bg-slate-500/20 text-slate-400';
}
