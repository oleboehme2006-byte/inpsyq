'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import type { Role } from '@/lib/access/roles';

interface TutorialEntryPointProps {
    role: Role;
}

function roleToTrack(role: Role): 'executive' | 'teamlead' | 'admin' {
    if (role === 'EXECUTIVE') return 'executive';
    if (role === 'TEAMLEAD') return 'teamlead';
    return 'admin';
}

/**
 * TutorialEntryPoint
 *
 * Renders a fixed bottom-right button linking to the role-appropriate tutorial.
 * On first mount, checks if the user has seen their tutorial — if not, redirects
 * them automatically (first-login auto-open).
 *
 * Best-effort: any fetch failure is silently swallowed to never block the dashboard.
 */
export function TutorialEntryPoint({ role }: TutorialEntryPointProps) {
    const router = useRouter();
    const pathname = usePathname();
    const hasChecked = useRef(false);
    const track = roleToTrack(role);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        fetch('/api/user/tutorial-status')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data?.seen) return;
                if (!data.seen[track]) {
                    // First login — auto-open tutorial, pass current path as returnTo
                    router.push(`/tutorial/${track}?returnTo=${encodeURIComponent(pathname)}`);
                }
            })
            .catch(() => {
                // Never block the dashboard
            });
    }, [track, pathname, router]);

    return (
        <a
            href={`/tutorial/${track}`}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0A0A0A]/90 border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-all text-xs font-mono backdrop-blur-md shadow-lg"
            title="Open your tutorial"
        >
            <BookOpen className="w-3.5 h-3.5" />
            Tutorial
        </a>
    );
}
