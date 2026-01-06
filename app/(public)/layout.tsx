/**
 * Public Layout
 * 
 * No auth required for pages in this route group.
 * Used for landing page and demo mode.
 */

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
