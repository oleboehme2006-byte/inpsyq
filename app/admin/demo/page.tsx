'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DemoConfig, { DemoSettings } from '@/components/admin/DemoConfig';
import DemoDashboard from '@/components/admin/DemoDashboard';
import BackgroundEffects from '@/components/BackgroundEffects';

export default function AdminDemoPage() {
    const [settings, setSettings] = useState<DemoSettings | null>(null);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-purple-500/30">
            <BackgroundEffects />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        InPsyq Live Demo
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Real-time visualization of the frozen backend core analytics.
                    </p>
                </header>

                {/* Configuration Panel */}
                <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                    <DemoConfig onConfigApply={setSettings} />
                </section>

                {/* Dashboard Visualization */}
                {settings ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <DemoDashboard settings={settings} />
                    </motion.div>
                ) : (
                    <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        Configure the demo above and click "Load Data" to begin.
                    </div>
                )}
            </div>
        </main>
    );
}
