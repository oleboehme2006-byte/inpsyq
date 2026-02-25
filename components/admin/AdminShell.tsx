'use client';

/**
 * AdminShell — Sidebar layout for all admin pages.
 *
 * Navigation maps exactly to the real route set:
 *   /admin           Overview (live health + setup + alerts)
 *   /admin/setup     Onboarding wizard
 *   /admin/users     Member management
 *   /admin/teams     Team CRUD
 *   /admin/roster    Bulk import + pending invites
 *   /admin/pipeline  Weekly run history + manual trigger
 *   /admin/system    Health checks + alert feed + retention
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    LayoutGrid,
    UserPlus,
    Zap,
    Server,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    orgName?: string;
    children: React.ReactNode;
}

const NAV_ITEMS = [
    { href: '/admin',          label: 'Overview',  icon: LayoutDashboard, exact: true  },
    { href: '/admin/setup',    label: 'Setup',     icon: CheckSquare,     exact: false },
    { href: '/admin/users',    label: 'Users',     icon: Users,           exact: false },
    { href: '/admin/teams',    label: 'Teams',     icon: LayoutGrid,      exact: false },
    { href: '/admin/roster',   label: 'Roster',    icon: UserPlus,        exact: false },
    { href: '/admin/pipeline', label: 'Pipeline',  icon: Zap,             exact: false },
    { href: '/admin/system',   label: 'System',    icon: Server,          exact: false },
];

export default function AdminShell({ orgName, children }: AdminShellProps) {
    const pathname = usePathname();

    const isActive = (item: typeof NAV_ITEMS[0]) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href);

    return (
        <div className="min-h-screen bg-bg-base flex">
            {/* Sidebar */}
            <aside className="w-60 border-r border-white/5 flex flex-col shrink-0">

                {/* Logo */}
                <div className="h-16 px-6 flex items-center border-b border-white/5">
                    <Link href="/">
                        <InPsyqLogo size="sm" />
                    </Link>
                </div>

                {/* Org / Role Badge */}
                <div className="px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Admin</span>
                    </div>
                    {orgName && (
                        <p className="text-sm font-medium text-white mt-1 truncate">{orgName}</p>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-[#8B5CF6]/10 text-white'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                                )}
                            >
                                <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#8B5CF6]' : '')} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5">
                    <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest">
                        © 2026 inPsyq
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
