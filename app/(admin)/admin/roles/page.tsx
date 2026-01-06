/**
 * ADMIN: Roles
 */

export default function AdminRolesPage() {
    return (
        <div className="p-8" data-testid="admin-page">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Roles
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    This section will allow administrators to view role definitions and permissions,
                    including EMPLOYEE, TEAMLEAD, EXECUTIVE, and ADMIN capabilities.
                </p>
            </header>
        </div>
    );
}
