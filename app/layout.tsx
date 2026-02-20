import '@/app/globals.css';
import { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'inPsyq - Psychological Analytics Platform',
    description: 'Instrument-grade psychological analytics for organizational health',
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === 'production';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en" className="dark">
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    {IS_PROD && PLAUSIBLE_DOMAIN && (
                        <script
                            defer
                            data-domain={PLAUSIBLE_DOMAIN}
                            src="https://plausible.io/js/script.js"
                        />
                    )}
                </head>
                <body className="bg-bg-base text-text-primary antialiased">
                    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
                        {children}
                    </Suspense>
                </body>
            </html>
        </ClerkProvider>
    );
}
