'use client';

/**
 * AdminShell — Dark-themed sidebar shell for admin pages
 * 
 * Provides: branded sidebar with nav links, org name display, main content area.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { Users, Settings, LayoutDashboard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminShellProps {
    orgName?: string;
    children: React.ReactNode;
}

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/teams', label: 'Teams', icon: Users }, // Keeping Users icon for now, or change to LayoutGrid
    { href: '/executive', label: 'Executive View', icon: Shield },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminShell({ orgName, children }: AdminShellProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-bg-base flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 flex flex-col shrink-0">
                {/* Logo */}
                <div className="h-16 px-6 flex items-center border-b border-white/5">
                    <Link href="/">
                        <InPsyqLogo size="sm" />
                    </Link>
                </div>

                {/* Org Badge */}
                {orgName && (
                    <div className="px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Admin</span>
                        </div>
                        <p className="text-sm font-medium text-white mt-1 truncate">{orgName}</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[#8B5CF6]/10 text-white"
                                        : "text-text-secondary hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-[#8B5CF6]" : "")} />
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
