import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';

export default function TutorialLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full min-h-screen overflow-auto bg-black text-text-primary relative selection:bg-accent-primary/30 flex flex-col">
            <nav className="w-full h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50 sticky top-0 bg-black/80 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-3 py-1.5 rounded-md">
                    <ArrowLeft className="w-4 h-4" /> Exit Tutorial
                </Link>
                <div className="opacity-50">
                    <InPsyqLogo size="sm" />
                </div>
            </nav>
            <main className="flex-1 w-full relative">
                {children}
            </main>
        </div>
    );
}
