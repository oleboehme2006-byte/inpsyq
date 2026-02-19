import { resolveAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth gate: EXECUTIVE or ADMIN only
    if (!DEMO_MODE) {
        const authResult = await resolveAuthContext();
        if (!authResult.authenticated || !authResult.context) {
            redirect('/login');
        }
        const role = authResult.context.role;
        if (role !== 'EXECUTIVE' && role !== 'ADMIN') {
            redirect('/measure');
        }
    }

    return (
        <div style={styles.container}>
            <nav style={styles.sidebar}>
                <h2 style={styles.sidebarTitle}>Settings</h2>
                <div style={styles.navLinks}>
                    <NavLink href="/settings/general" label="General" icon="⚙️" />
                    <NavLink href="/settings/teams" label="Teams" icon="👥" />
                    <NavLink href="/settings/members" label="Members" icon="🧑‍💼" />
                    <NavLink href="/settings/billing" label="Billing" icon="💳" />
                </div>
                <div style={styles.backLink}>
                    <Link href="/executive" style={styles.back}>← Back to Dashboard</Link>
                </div>
            </nav>
            <main style={styles.content}>
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
        <Link href={href} style={styles.navLink}>
            <span style={styles.navIcon}>{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        background: '#0f0f23',
    },
    sidebar: {
        width: '240px',
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarTitle: {
        color: '#fff',
        fontSize: '16px',
        fontWeight: 600,
        padding: '0 12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px',
    },
    navLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        fontSize: '14px',
        transition: 'all 0.15s ease',
    },
    navIcon: {
        fontSize: '16px',
    },
    backLink: {
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
    },
    back: {
        color: 'rgba(255,255,255,0.4)',
        textDecoration: 'none',
        fontSize: '13px',
        padding: '8px 12px',
        display: 'block',
    },
    content: {
        flex: 1,
        padding: '32px 48px',
        maxWidth: '960px',
    },
};
