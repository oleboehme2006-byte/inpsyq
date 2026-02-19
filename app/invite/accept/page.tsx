'use client';

/**
 * INVITE ACCEPTANCE PAGE — /invite/accept?token=...
 * 
 * Flow:
 * 1. If not signed in → show Clerk SignUp
 * 2. If signed in → call POST /api/invite/accept with the token
 * 3. On success → redirect to the appropriate dashboard
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, SignUp } from '@clerk/nextjs';

export default function InviteAcceptPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();

    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'signup' | 'accepting' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const acceptInvite = async () => {
        setStatus('accepting');
        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (data.ok) {
                setStatus('success');
                setMessage(data.message || 'Welcome! Redirecting...');
                setTimeout(() => {
                    router.push(data.redirectTo || '/');
                }, 1500);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to accept invitation.');
            }
        } catch {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    useEffect(() => {
        if (!isLoaded) return;

        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing invitation link.');
            return;
        }

        if (!isSignedIn) {
            setStatus('signup');
            return;
        }

        // User is signed in — accept the invite
        acceptInvite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, token]);



    if (!isLoaded || status === 'loading') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.spinner} />
                    <p style={styles.text}>Loading...</p>
                </div>
            </div>
        );
    }

    if (status === 'signup') {
        return (
            <div style={styles.container}>
                <div style={styles.signupCard}>
                    <h1 style={styles.heading}>Join InPsyq</h1>
                    <p style={styles.subtext}>Create your account to accept the invitation.</p>
                    <SignUp
                        redirectUrl={`/invite/accept?token=${token}`}
                        appearance={{
                            elements: {
                                rootBox: { width: '100%' },
                                card: { boxShadow: 'none', border: 'none' },
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    if (status === 'accepting') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.spinner} />
                    <p style={styles.text}>Setting up your account...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.checkmark}>✓</div>
                    <h2 style={styles.heading}>{message}</h2>
                    <p style={styles.subtext}>Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.errorIcon}>✕</div>
                <h2 style={styles.heading}>Invitation Error</h2>
                <p style={styles.errorText}>{message}</p>
                <button onClick={() => router.push('/')} style={styles.button}>
                    Go to Homepage
                </button>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
        padding: '24px',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '48px',
        textAlign: 'center' as const,
        maxWidth: '400px',
        width: '100%',
    },
    signupCard: {
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center' as const,
        maxWidth: '480px',
        width: '100%',
    },
    heading: {
        color: '#fff',
        fontSize: '20px',
        fontWeight: 600,
        margin: '16px 0 8px',
    },
    text: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px',
    },
    subtext: {
        color: '#666',
        fontSize: '14px',
        marginBottom: '24px',
    },
    spinner: {
        width: '36px',
        height: '36px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 16px',
    },
    checkmark: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#10b981',
        color: '#fff',
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    errorIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: '#ef4444',
        color: '#fff',
        fontSize: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    errorText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px',
        marginBottom: '24px',
    },
    button: {
        padding: '10px 24px',
        background: '#6366f1',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
    },
};
