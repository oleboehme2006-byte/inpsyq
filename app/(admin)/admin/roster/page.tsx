'use client';

/**
 * ROSTER IMPORT PAGE
 * 
 * UI for bulk uploading employees via CSV (JSON).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RosterImportPage() {
    const router = useRouter();
    const [csvContent, setCsvContent] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [result, setResult] = useState<any>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCsvContent(event.target?.result as string);
            setStatus('PARSING');
        };
        reader.readAsText(file);
    };

    const parseAndSubmit = async () => {
        if (!csvContent) return;
        setStatus('UPLOADING');

        try {
            // Simple CSV Parse (Assumes Header: email,role,team,name)
            const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
            const headers = lines[0].toLowerCase().split(',');

            // Map headers to keys
            const getIdx = (key: string) => headers.findIndex(h => h.includes(key));
            const emailIdx = getIdx('email');
            const roleIdx = getIdx('role');
            const teamIdx = getIdx('team');
            const nameIdx = getIdx('name');

            if (emailIdx === -1 || roleIdx === -1) {
                throw new Error("CSV must have 'email' and 'role' columns");
            }

            const users = lines.slice(1).map(line => {
                const parts = line.split(',').map(p => p.trim());
                return {
                    email: parts[emailIdx],
                    role: parts[roleIdx],
                    teamName: teamIdx > -1 ? parts[teamIdx] : undefined,
                    name: nameIdx > -1 ? parts[nameIdx] : undefined
                };
            }).filter(u => u.email && u.role); // Filter empty rows

            const res = await fetch('/api/admin/roster/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

            setResult(data);
            setStatus('SUCCESS');

        } catch (e: any) {
            setResult({ error: e.message });
            setStatus('ERROR');
        }
    };

    return (
        <div className="p-8 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Roster Import
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Upload a CSV file to bulk invite users and create teams.
                </p>
            </header>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Upload CSV
                    </label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-purple-50 file:text-purple-700
                            hover:file:bg-purple-100"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Required columns: <code>email, role</code>. Optional: <code>team, name</code>
                        </p>
                    </div>
                </div>

                {status === 'PARSING' || (status === 'IDLE' && csvContent) ? (
                    <div className="mb-6">
                        <h4 className="text-sm font-medium mb-2">Preview</h4>
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs font-mono overflow-auto max-h-40">
                            {csvContent.split('\n').slice(0, 5).map((l, i) => <div key={i}>{l}</div>)}
                            {csvContent.split('\n').length > 5 && <div>...</div>}
                        </div>
                        <button
                            onClick={parseAndSubmit}
                            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium text-sm transition-colors"
                        >
                            Import Users
                        </button>
                    </div>
                ) : null}

                {status === 'UPLOADING' && (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-slate-600">Processing roster...</p>
                    </div>
                )}

                {status === 'SUCCESS' && result && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Import Complete</h4>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            Success: {result.successCount} | Failed: {result.failCount}
                        </p>
                        {result.results?.filter((r: any) => r.status === 'error').length > 0 && (
                            <div className="mt-4">
                                <h5 className="text-xs font-bold uppercase text-green-800/70 mb-1">Errors</h5>
                                <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400">
                                    {result.results.filter((r: any) => r.status === 'error').map((r: any, i: number) => (
                                        <li key={i}>{r.email}: {r.error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button
                            onClick={() => { setStatus('IDLE'); setCsvContent(''); setResult(null); }}
                            className="mt-4 text-sm text-green-700 underline"
                        >
                            Import Another
                        </button>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                        <h4 className="font-semibold text-red-800 dark:text-red-300">Import Failed</h4>
                        <p className="text-sm text-red-700 dark:text-red-400">{result?.error}</p>
                        <button
                            onClick={() => setStatus('PARSING')} // Retry from parse
                            className="mt-2 text-sm text-red-700 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
