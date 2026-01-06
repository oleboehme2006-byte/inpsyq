/**
 * ADMIN OVERVIEW PAGE — Admin dashboard entry point
 */

export default function AdminOverviewPage() {
    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Admin Overview
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Welcome to the InPsyq admin control panel. Use the navigation to access
                    organization settings, user management, and system monitoring.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Organization</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure organization settings, view health metrics, and access audit logs.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Users</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Manage team members, send invites, and configure role assignments.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">System</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Monitor weekly pipeline runs, system alerts, and diagnostics.
                    </p>
                </div>
            </div>
        </div>
    );
}
