'use client';

/**
 * ImportPanel — Client island for bulk roster import.
 *
 * Accepts CSV text (email, role, teamName, name columns) or manual row entry.
 * POSTs to POST /api/admin/roster/import and shows per-row results.
 *
 * CSV format: email,role,teamName,name
 * Supported roles: ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE
 */

import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportRow {
    email: string;
    role: string;
    teamName: string;
    name: string;
}

interface ImportResult {
    email: string;
    status: 'success' | 'error';
    error: string | null;
}

const VALID_ROLES = ['ADMIN', 'EXECUTIVE', 'TEAMLEAD', 'EMPLOYEE'];

const EMPTY_ROW: ImportRow = { email: '', role: 'EMPLOYEE', teamName: '', name: '' };

function parseCSV(raw: string): ImportRow[] {
    const lines = raw.trim().split('\n');
    if (lines.length === 0) return [];

    // Detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('email') || firstLine.includes('role');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines
        .map(line => {
            const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
            return {
                email:    parts[0] ?? '',
                role:     (parts[1] ?? 'EMPLOYEE').toUpperCase(),
                teamName: parts[2] ?? '',
                name:     parts[3] ?? '',
            };
        })
        .filter(r => r.email.includes('@'));
}

export function ImportPanel() {
    const [rows, setRows]           = useState<ImportRow[]>([{ ...EMPTY_ROW }]);
    const [csvMode, setCsvMode]     = useState(false);
    const [csvText, setCsvText]     = useState('');
    const [loading, setLoading]     = useState(false);
    const [results, setResults]     = useState<ImportResult[] | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // ── CSV handling ────────────────────────────────────────────────────────────

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setCsvText(text);
            setCsvMode(true);
        };
        reader.readAsText(file);
    };

    const applyCsvParse = () => {
        setParseError(null);
        try {
            const parsed = parseCSV(csvText);
            if (parsed.length === 0) {
                setParseError('No valid rows found. Ensure CSV has email column.');
                return;
            }
            setRows(parsed);
            setCsvMode(false);
        } catch {
            setParseError('Failed to parse CSV. Check format.');
        }
    };

    // ── Manual row editing ──────────────────────────────────────────────────────

    const addRow = () => setRows(r => [...r, { ...EMPTY_ROW }]);

    const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));

    const updateRow = (i: number, field: keyof ImportRow, value: string) => {
        setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
    };

    // ── Submit ──────────────────────────────────────────────────────────────────

    const handleImport = async () => {
        const valid = rows.filter(r => r.email.includes('@'));
        if (valid.length === 0) return;

        setLoading(true);
        setResults(null);

        try {
            const res = await fetch('/api/admin/roster/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: valid }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setResults([{
                    email: '(batch)',
                    status: 'error',
                    error: data.error?.message ?? 'Import failed.',
                }]);
                return;
            }
            setResults(data.results ?? []);
        } catch (e: any) {
            setResults([{
                email: '(batch)',
                status: 'error',
                error: e.message ?? 'Unexpected error.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    const validCount   = rows.filter(r => r.email.includes('@')).length;
    const successCount = results?.filter(r => r.status === 'success').length ?? 0;
    const failCount    = results?.filter(r => r.status === 'error').length ?? 0;

    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-base font-display font-medium text-white">Import Roster</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                        Bulk-invite users by CSV or manual entry. Roles: ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Upload CSV
                    </button>
                </div>
            </div>

            {/* CSV text mode */}
            {csvMode && (
                <div className="space-y-2">
                    <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                        Paste CSV (email, role, teamName, name)
                    </p>
                    <textarea
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        rows={6}
                        placeholder={"email,role,teamName,name\nalice@co.com,EMPLOYEE,Engineering,Alice\nbob@co.com,TEAMLEAD,Product,Bob"}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none"
                    />
                    {parseError && (
                        <p className="text-xs text-strain">{parseError}</p>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={applyCsvParse}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 transition-colors"
                        >
                            Parse CSV
                        </button>
                        <button
                            onClick={() => { setCsvMode(false); setParseError(null); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Manual row editor */}
            {!csvMode && (
                <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_120px_160px_120px_32px] gap-2 px-1">
                        {['Email', 'Role', 'Team', 'Name', ''].map((h, i) => (
                            <span key={i} className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    {rows.map((row, i) => (
                        <div key={i} className="grid grid-cols-[1fr_120px_160px_120px_32px] gap-2 items-center">
                            <input
                                type="email"
                                value={row.email}
                                onChange={e => updateRow(i, 'email', e.target.value)}
                                placeholder="user@example.com"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                            />
                            <select
                                value={row.role}
                                onChange={e => updateRow(i, 'role', e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                            >
                                {VALID_ROLES.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={row.teamName}
                                onChange={e => updateRow(i, 'teamName', e.target.value)}
                                placeholder="Team name"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                            />
                            <input
                                type="text"
                                value={row.name}
                                onChange={e => updateRow(i, 'name', e.target.value)}
                                placeholder="Display name"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                            />
                            <button
                                onClick={() => removeRow(i)}
                                disabled={rows.length === 1}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-text-tertiary hover:text-strain hover:bg-strain/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addRow}
                        className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add row
                    </button>
                </div>
            )}

            {/* Submit */}
            {!csvMode && (
                <div className="flex items-center gap-4 pt-1">
                    <button
                        onClick={handleImport}
                        disabled={loading || validCount === 0}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            validCount > 0
                                ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                                : 'bg-white/5 text-text-tertiary border border-white/10 cursor-not-allowed',
                            loading && 'opacity-60 cursor-not-allowed',
                        )}
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                            : <><Upload className="w-4 h-4" /> Import {validCount > 0 ? `${validCount} user${validCount !== 1 ? 's' : ''}` : 'Users'}</>
                        }
                    </button>
                    {validCount > 0 && !loading && (
                        <span className="text-xs text-text-secondary">
                            {validCount} valid row{validCount !== 1 ? 's' : ''} ready to import
                        </span>
                    )}
                </div>
            )}

            {/* Results */}
            {results && (
                <div className="space-y-3">
                    {/* Summary */}
                    <div className="flex items-center gap-4">
                        {successCount > 0 && (
                            <div className="flex items-center gap-1.5 text-engagement text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                {successCount} invited
                            </div>
                        )}
                        {failCount > 0 && (
                            <div className="flex items-center gap-1.5 text-strain text-sm">
                                <XCircle className="w-4 h-4" />
                                {failCount} failed
                            </div>
                        )}
                    </div>

                    {/* Error rows */}
                    {results.filter(r => r.status === 'error').length > 0 && (
                        <div className="rounded-lg bg-strain/5 border border-strain/20 divide-y divide-strain/10">
                            {results.filter(r => r.status === 'error').map((r, i) => (
                                <div key={i} className="flex items-start gap-2 px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-strain shrink-0 mt-0.5" />
                                    <span className="text-xs font-mono text-text-secondary">{r.email}</span>
                                    <span className="text-xs text-strain ml-1">{r.error}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
