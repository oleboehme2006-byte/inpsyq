
import Link from 'next/link';
import { Users, LayoutGrid, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
    const cards = [
        {
            title: 'User Management',
            description: 'Invite members, assign teams, and manage roles.',
            href: '/admin/users',
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Team Structure',
            description: 'Manage organizations and team hierarchies.',
            href: '/admin/teams',
            icon: LayoutGrid,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            title: 'Pipeline Status',
            description: 'Monitor data processing and weekly report generation.',
            href: '/admin/pipeline', // Hypothetical
            icon: Activity,
            color: 'text-green-400',
            bg: 'bg-green-400/10'
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-semibold text-white">Admin Dashboard</h1>
                <p className="text-text-secondary mt-2">Overview of organization health and system status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="block p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">{card.title}</h3>
                            <p className="text-sm text-text-secondary">{card.description}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
