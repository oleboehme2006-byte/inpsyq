import React from 'react';
import { cn } from '@/lib/utils';
import { executiveMockData } from '@/lib/mock/executiveData';
import { ExecutiveTeam } from '@/services/dashboard/executiveReader';
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TeamPortfolioTableProps {
    teams: ExecutiveTeam[];
}

export function TeamPortfolioTable({ teams }: TeamPortfolioTableProps) {
    // Fall back to mock data when no real teams are available (demo mode)
    const resolvedTeams: ExecutiveTeam[] = (teams && teams.length > 0)
        ? teams
        : (executiveMockData.teams as unknown as ExecutiveTeam[]);

    // Strict priority map
    const getPriority = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('critical')) return 0;
        if (s.includes('risk')) return 1;
        if (s.includes('healthy')) return 2;
        return 99;
    };

    // Sort teams by status priority: Critical > At Risk > Healthy
    const sortedTeams = [...resolvedTeams].sort((a, b) => {
        return getPriority(a.status) - getPriority(b.status);
    });

    // Calculate Counts for the Bar
    const criticalCount = resolvedTeams.filter(t => t.status === 'Critical').length;
    const riskCount     = resolvedTeams.filter(t => t.status === 'At Risk').length;
    const healthyCount  = resolvedTeams.filter(t => t.status === 'Healthy').length;
    const total         = resolvedTeams.length;

    const criticalWidth = (criticalCount / total) * 100;
    const riskWidth     = (riskCount     / total) * 100;
    const healthyWidth  = (healthyCount  / total) * 100;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Critical': return <AlertTriangle className="w-3.5 h-3.5 text-strain" />;
            case 'At Risk':  return <AlertCircle   className="w-3.5 h-3.5 text-withdrawal" />;
            case 'Healthy':  return <CheckCircle   className="w-3.5 h-3.5 text-engagement" />;
            default: return null;
        }
    };

    return (
        <div className="w-full rounded-xl p-6 border border-white/10 bg-[#050505]">
            {/* Header Title */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-medium text-white">Team Portfolio</h3>
            </div>

            {/* Dynamic Status Bar & Labels */}
            <div className="w-full mb-8">
                {/* The Bar */}
                <div className="flex w-full h-3 rounded-full overflow-hidden mb-3">
                    {criticalWidth > 0 && <div style={{ width: `${criticalWidth}%` }} className="h-full bg-strain" />}
                    {riskWidth     > 0 && <div style={{ width: `${riskWidth}%`     }} className="h-full bg-withdrawal" />}
                    {healthyWidth  > 0 && <div style={{ width: `${healthyWidth}%`  }} className="h-full bg-engagement" />}
                </div>

                {/* Labels Layout */}
                <div className="flex w-full text-sm font-medium text-text-secondary">
                    {criticalWidth > 0 && (
                        <div style={{ width: `${criticalWidth}%` }} className="flex justify-center items-center">
                            <span className="flex items-center gap-2 text-strain whitespace-nowrap">
                                <AlertTriangle className="w-4 h-4" /> {criticalCount} Critical
                            </span>
                        </div>
                    )}
                    {riskWidth > 0 && (
                        <div style={{ width: `${riskWidth}%` }} className="flex justify-center items-center">
                            <span className="flex items-center gap-2 text-withdrawal whitespace-nowrap">
                                <AlertCircle className="w-4 h-4" /> {riskCount} At Risk
                            </span>
                        </div>
                    )}
                    {healthyWidth > 0 && (
                        <div style={{ width: `${healthyWidth}%` }} className="flex justify-center items-center">
                            <span className="flex items-center gap-2 text-engagement whitespace-nowrap">
                                <CheckCircle className="w-4 h-4" /> {healthyCount} Healthy
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-[11px] font-mono text-text-tertiary uppercase tracking-widest">
                            <th className="px-4 py-2 font-medium cursor-pointer hover:text-white transition-colors">Team</th>
                            <th className="px-4 py-2 font-medium cursor-pointer hover:text-white transition-colors pl-2">Status</th>
                            <th className="px-4 py-2 font-medium text-right cursor-pointer hover:text-white transition-colors">Strain</th>
                            <th className="px-4 py-2 font-medium text-right cursor-pointer hover:text-white transition-colors">Withdrawal</th>
                            <th className="px-4 py-2 font-medium text-right cursor-pointer hover:text-white transition-colors">Trust Gap</th>
                            <th className="px-4 py-2 font-medium text-right cursor-pointer hover:text-white transition-colors">Engagement</th>
                            <th className="px-4 py-2 font-medium text-right cursor-pointer hover:text-white transition-colors">Coverage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {sortedTeams.map((team) => {
                            // Real teams have a teamId UUID; mock teams use name as slug
                            const teamHref = (team as any).teamId
                                ? `/team/${(team as any).teamId}`
                                : `/team/${team.name.toLowerCase()}`;
                            return (
                                <tr key={team.name} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                                    <td className="px-4 py-2 group-hover:text-accent-primary transition-colors">
                                        <Link href={teamHref} className="flex items-center gap-2 font-medium text-base text-text-primary group-hover:text-accent-primary transition-colors">
                                            {team.name}
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0" />
                                        </Link>
                                        <div className="text-xs text-text-tertiary font-mono mt-0.5">
                                            {team.members || 20} Members
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 pl-2">
                                        <div className={cn("inline-flex items-center gap-2 px-0 py-0.5 rounded text-sm font-bold",
                                            team.status === 'Critical' ? "text-strain" :
                                                team.status === 'At Risk' ? "text-withdrawal" :
                                                    "text-engagement"
                                        )}>
                                            {getStatusIcon(team.status)}
                                            <span className="uppercase tracking-wider text-xs pt-px">{team.status}</span>
                                        </div>
                                    </td>
                                    <td className={cn("px-4 py-2 text-right font-mono", team.strain > 60 ? "text-strain font-bold" : "text-text-secondary")}>
                                        {team.strain}%
                                    </td>
                                    <td className={cn("px-4 py-2 text-right font-mono", team.withdrawal > 50 ? "text-withdrawal font-bold" : "text-text-secondary")}>
                                        {team.withdrawal}%
                                    </td>
                                    <td className={cn("px-4 py-2 text-right font-mono", team.trust > 40 ? "text-text-secondary" : "text-engagement")}>
                                        {team.trust}%
                                    </td>
                                    <td className={cn("px-4 py-2 text-right font-mono", team.engagement < 50 ? "text-strain" : "text-engagement")}>
                                        {team.engagement}%
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-text-tertiary">
                                        {team.coverage}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
