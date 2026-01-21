'use client';

/**
 * ORG SELECT PAGE — Organization Selector for Multi-Org Users
 * 
 * Shows organization options fetched from /api/org/list.
 * Handles loading, error, and empty states without dead-ending.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OrgOption {
    orgId: string;
    name: string;
    role: string;
}

export default function OrgSelectPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState<OrgOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/org/list');
            const resData = await res.json();

            if (res.ok && resData.ok && resData.data?.orgs) {
                setOrgs(resData.data.orgs);
            } else if (!res.ok && res.status === 401) {
                // Not authenticated - redirect to login
                router.push('/login');
                return;
            } else {
                setError(resData.error?.message || 'Failed to load organizations');
                setOrgs([]);
            }
        } catch {
            setError('Network error. Please check your connection.');
            setOrgs([]);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const selectOrg = async (orgId: string) => {
        setSelecting(orgId);
        setError(null);

        try {
            const res = await fetch('/api/org/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId }),
            });

            const data = await res.json() as { ok: boolean; redirectTo?: string; error?: { message?: string } };

            if (res.ok && data.ok) {
                router.push(data.redirectTo || '/');
            } else {
                setError(data.error?.message || 'Failed to select organization');
                setSelecting(null);
            }
        } catch {
            setError('Network error');
            setSelecting(null);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900" data-testid="org-select-loading">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-slate-600 dark:text-slate-400">Loading organizations...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4" data-testid="org-select-page">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Select Organization
                    </h1>

                    {orgs.length > 0 ? (
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {orgs.length === 1
                                ? 'Confirm your organization to continue.'
                                : 'You have access to multiple organizations. Please select one to continue.'}
                        </p>
                    ) : (
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            No organizations available.
                        </p>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm mb-4" data-testid="org-select-error">
                            {error}
                        </div>
                    )}

                    {orgs.length > 0 ? (
                        <div className="space-y-3" data-testid="org-list">
                            {orgs.map((org) => (
                                <button
                                    key={org.orgId}
                                    onClick={() => selectOrg(org.orgId)}
                                    disabled={selecting !== null}
                                    className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                                    data-testid="org-option"
                                    data-org-id={org.orgId}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {org.name}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                Role: {org.role}
                                            </div>
                                        </div>
                                        {selecting === org.orgId && (
                                            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8" data-testid="org-empty-state">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                You don&apos;t have access to any organizations yet.
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
                                Contact your administrator to request access.
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            onClick={fetchOrgs}
                            disabled={loading}
                            className="flex-1 py-2 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            data-testid="retry-button"
                        >
                            Retry
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 py-2 px-4 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                            data-testid="logout-button"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
