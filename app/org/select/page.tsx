'use client';

/**
 * ORG SELECT PAGE — Organization Selector for Multi-Org Users
 * 
 * Minimal page to select which organization to access.
 */

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetch('/api/org/list')
            .then(res => res.json())
            .then((resData: { ok: boolean; data?: { orgs: OrgOption[] } }) => {
                if (resData.ok && resData.data?.orgs) {
                    setOrgs(resData.data.orgs);
                } else {
                    // Force empty if invalid response
                    setOrgs([]);
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load organizations');
                setLoading(false);
            });
    }, []);

    const selectOrg = async (orgId: string) => {
        setSelecting(orgId);
        setError(null);

        try {
            const res = await fetch('/api/org/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId }),
            });

            const data = await res.json() as { ok: boolean; redirectTo?: string; error?: string };

            if (res.ok && data.ok) {
                router.push(data.redirectTo || '/');
            } else {
                setError(data.error || 'Failed to select organization');
                setSelecting(null);
            }
        } catch {
            setError('Network error');
            setSelecting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-slate-600 dark:text-slate-400">Loading...</div>
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
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        You have access to multiple organizations. Please select one to continue.
                    </p>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3" data-testid="org-list">
                        {orgs.length === 0 && !error && (
                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm" data-testid="org-empty-state">
                                <p className="font-medium">No Organizations Available</p>
                                <p className="mt-1">Your account doesn&apos;t have access to any organizations. Please contact your administrator.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
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
                                        <div className="font-medium text-slate-900 dark:text-white" data-testid="org-name">
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
                </div>
            </div>
        </div>
    );
}
