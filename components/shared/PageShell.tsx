import React from 'react';
import Link from 'next/link';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { ArrowLeft } from 'lucide-react';

interface PageShellProps {
    children: React.ReactNode;
    showBackLink?: boolean;
    backHref?: string;
    backLabel?: string;
}

/**
 * PageShell — Consistent dark-themed wrapper for prose pages (legal, auth, etc.)
 * 
 * Provides: dark background, inPsyq logo top-right, optional back link, footer with legal links.
 */
export function PageShell({ children, showBackLink = true, backHref = '/', backLabel = 'Home' }: PageShellProps) {
    return (
        <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-body">
            {/* Header */}
            <header className="w-full border-b border-white/5">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    {showBackLink ? (
                        <Link href={backHref} className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span>{backLabel}</span>
                        </Link>
                    ) : (
                        <div />
                    )}
                    <Link href="/">
                        <InPsyqLogo size="sm" />
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-16 px-6">
                <div className="max-w-3xl mx-auto prose prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-[#8B5CF6] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-table:text-sm max-w-none">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-text-tertiary">
                    <span>© 2026 inPsyq GmbH</span>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
                        <Link href="/imprint" className="hover:text-text-secondary transition-colors">Imprint</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
