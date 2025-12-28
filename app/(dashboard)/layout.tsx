import '@/app/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'inPsyq Dashboard',
    description: 'Instrument-grade psychological analytics for organizational health',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="bg-bg-base text-text-primary antialiased">
                {children}
            </body>
        </html>
    );
}
