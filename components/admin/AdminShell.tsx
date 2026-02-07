'use client';

/**
 * ADMIN SHELL — Reusable Admin UI Container
 * 
 * Provides consistent layout with sidebar navigation for all admin pages.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    label: string;
    href: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Admin',
        items: [
            { label: 'Overview', href: '/admin' },
        ],
    },
    {
        title: 'Organization',
        items: [
            { label: 'Settings', href: '/admin/org/settings' },
            { label: 'Health', href: '/admin/org/health' },
            { label: 'Audit Log', href: '/admin/org/audit' },
        ],
    },
    {
        title: 'Users',
        items: [
            { label: 'Members', href: '/admin/users' },
            { label: 'Invites', href: '/admin/invites' },
            { label: 'Roster Import', href: '/admin/roster' },
            { label: 'Roles', href: '/admin/roles' },
        ],
    },
    {
        title: 'Teams',
        items: [
            { label: 'Team List', href: '/admin/teams' },
        ],
    },
    {
        title: 'System',
        items: [
            { label: 'Weekly Runs', href: '/admin/system/weekly' },
            { label: 'Alerts', href: '/admin/system/alerts' },
            { label: 'Diagnostics', href: '/admin/system/diagnostics' },
        ],
    },
];

interface AdminShellProps {
    children: React.ReactNode;
    orgName?: string;
}

export default function AdminShell({ children, orgName }: AdminShellProps) {
    const pathname = usePathname();
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950" data-testid="admin-shell">
            {/* Sidebar */}
            <aside
                className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col"
                data-testid="admin-sidebar"
            >
                {/* Logo / Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            IP
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">Admin</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/admin' && pathname.startsWith(item.href));

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer: Org + Env */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {orgName && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="block font-medium text-slate-700 dark:text-slate-300">
                                {orgName}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDev
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                }`}
                        >
                            {isDev ? 'DEV' : 'PROD'}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto" data-testid="admin-page">
                {children}
            </main>
        </div>
    );
}
