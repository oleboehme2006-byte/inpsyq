/**
 * /admin/system — System Health & Operations
 *
 * Hybrid page:
 *   - Server shell: fetches health snapshot + alert feed from DB
 *   - Client island: RetentionPanel for data retention management
 */

import React from 'react';
import { resolveAuthContext } from '@/lib/auth/context';
import { getOrgHealthSummary, getRecentAlerts } from '@/lib/admin/overviewData';
import { RetentionPanel } from '@/components/admin/system/RetentionPanel';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    CheckCircle2, AlertTriangle, XCircle, AlertCircle,
    Server, Lock, Database, Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function MetricCard({
    label,
    value,
    icon: Icon,
    iconClass,
    sub,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    iconClass: string;
    sub?: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-[#050505] p-5">
            <div className="flex items-center gap-2 mb-3">
                <Icon className={cn('w-4 h-4', iconClass)} />
                <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">{label}</span>
            </div>
            <p className={cn(
                'text-3xl font-display font-semibold',
                typeof value === 'number' && value > 0 ? iconClass : 'text-white',
            )}>
                {value}
            </p>
            {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
        </div>
    );
}

function AlertSeverityIcon({ severity }: { severity: string }) {
    if (severity === 'critical') return <XCircle    className="w-4 h-4 text-strain"     />;
    if (severity === 'warning')  return <AlertTriangle className="w-4 h-4 text-withdrawal" />;
    return                               <AlertCircle  className="w-4 h-4 text-[#8B5CF6]" />;
}

export default async function SystemPage() {
    const auth = await resolveAuthContext();
    const orgId = auth.context?.orgId;
    if (!orgId) {
        return (
            <div className="p-8 text-text-secondary">
                No organization selected.{' '}
                <Link href="/org/select" className="text-[#8B5CF6] underline">Select one</Link>.
            </div>
        );
    }

    const [health, alerts] = await Promise.all([
        getOrgHealthSummary(orgId),
        getRecentAlerts(orgId, 20),
    ]);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount  = alerts.filter(a => a.severity === 'warning').length;

    return (
        <div className="p-8 max-w-[1200px] mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-semibold text-white">System Health</h1>
                <p className="text-text-secondary mt-1 text-sm">
                    Operational snapshot, alert feed, and data retention controls.
                </p>
            </div>

            {/* Health metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Locks Stuck"
                    value={health.locksStuck}
                    icon={Lock}
                    iconClass="text-strain"
                    sub={health.locksStuck === 0 ? 'All clear' : 'Teams need manual release'}
                />
                <MetricCard
                    label="Missing Products"
                    value={health.missingProducts}
                    icon={Database}
                    iconClass="text-withdrawal"
                    sub={health.missingProducts === 0 ? 'All teams have data' : 'Teams without pipeline output'}
                />
                <MetricCard
                    label="Missing Interps"
                    value={health.missingInterpretations}
                    icon={Activity}
                    iconClass="text-withdrawal"
                    sub={health.missingInterpretations === 0 ? 'All teams have briefings' : 'Teams without interpretations'}
                />
                <MetricCard
                    label="Active Alerts"
                    value={criticalCount + warningCount}
                    icon={criticalCount > 0 ? XCircle : warningCount > 0 ? AlertTriangle : CheckCircle2}
                    iconClass={criticalCount > 0 ? 'text-strain' : warningCount > 0 ? 'text-withdrawal' : 'text-engagement'}
                    sub={
                        criticalCount > 0 ? `${criticalCount} critical, ${warningCount} warning` :
                        warningCount > 0  ? `${warningCount} warning${warningCount !== 1 ? 's' : ''}` :
                        'System is healthy'
                    }
                />
            </div>

            {/* Alerts Feed */}
            <div className="rounded-xl border border-white/10 bg-[#050505] p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Server className="w-4 h-4 text-text-tertiary" />
                    <h2 className="text-base font-display font-medium text-white">Alert Feed</h2>
                    {alerts.length > 0 && (
                        <span className="ml-auto text-xs font-mono text-text-tertiary">
                            {alerts.length} item{alerts.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {alerts.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-text-tertiary">
                        <CheckCircle2 className="w-5 h-5 text-engagement" />
                        <span className="text-sm">No active alerts — system is healthy.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {alerts.map(alert => (
                            <div
                                key={alert.alertId}
                                className="flex items-start gap-3 py-3 last:pb-0"
                            >
                                <AlertSeverityIcon severity={alert.severity} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                                            {alert.alertType.replace(/_/g, ' ')}
                                        </span>
                                        {alert.isComputed && (
                                            <span className="text-[10px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">
                                                computed
                                            </span>
                                        )}
                                        <span className={cn(
                                            'text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold',
                                            alert.severity === 'critical' ? 'bg-strain/10 text-strain' :
                                            alert.severity === 'warning'  ? 'bg-withdrawal/10 text-withdrawal' :
                                            'bg-[#8B5CF6]/10 text-[#8B5CF6]',
                                        )}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary mt-0.5 leading-snug">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Retention Panel (client island) */}
            <RetentionPanel />

        </div>
    );
}
