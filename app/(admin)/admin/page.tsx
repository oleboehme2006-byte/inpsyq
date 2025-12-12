'use client';
import { useEffect, useState } from 'react';
import BrandLogo from '@/components/shared/BrandLogo';
import Link from 'next/link';

export default function AdminDashboard() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [aggregates, setAggregates] = useState<any[]>([]);

    // Fetch logic would typically go here
    // For now, assuming we land here and maybe show overview

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6">
                <BrandLogo />
                <nav className="mt-12 space-y-4">
                    <Link href="/admin" className="block font-medium">Dashboard</Link>
                    <Link href="/admin/teams" className="block text-slate-500 hover:text-black">Teams View</Link>
                    <Link href="/admin/settings" className="block text-slate-500 hover:text-black">Settings</Link>
                </nav>
            </aside>

            <main className="ml-64 p-12">
                <header className="mb-12">
                    <h1 className="text-3xl font-light">Organization Overview</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Active Profiles</h3>
                        <div className="text-4xl font-light">Loading...</div>
                        {/* Need to implement charts fetching */}
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Signal Volume</h3>
                        <div className="text-4xl font-light">--</div>
                    </div>
                </div>

                <div className="mt-12 bg-white p-8 rounded-xl border border-slate-200">
                    <h2 className="text-xl mb-6">Recent Team Profiles</h2>
                    <Link href="/admin/teams" className="text-blue-600 underline">View Teams Detail</Link>
                </div>
            </main>
        </div>
    );
}
