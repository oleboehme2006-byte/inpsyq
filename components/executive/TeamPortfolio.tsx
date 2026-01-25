"use client";

import { ArrowRight, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TeamData {
    id: string;
    name: string;
    status: "Critical" | "At Risk" | "Healthy";
    strain: number;
    withdrawal: number;
    trust: number;
    engagement: number;
    coverage: number;
}

// Mock Data matching screenshot approximately
const teams: TeamData[] = [
    { id: "product", name: "Product", status: "Critical", strain: 68, withdrawal: 55, trust: 42, engagement: 45, coverage: 68 },
    { id: "engineering", name: "Engineering", status: "At Risk", strain: 52, withdrawal: 38, trust: 28, engagement: 65, coverage: 82 },
    { id: "support", name: "Support", status: "At Risk", strain: 45, withdrawal: 35, trust: 32, engagement: 58, coverage: 88 },
    { id: "operations", name: "Operations", status: "Healthy", strain: 32, withdrawal: 25, trust: 22, engagement: 72, coverage: 75 },
    { id: "sales", name: "Sales", status: "Healthy", strain: 28, withdrawal: 22, trust: 18, engagement: 78, coverage: 91 },
    { id: "hr", name: "HR", status: "Healthy", strain: 25, withdrawal: 18, trust: 15, engagement: 82, coverage: 95 },
];

export function TeamPortfolio() {
    return (
        <div className="w-full space-y-6">
            <h3 className="text-xl font-semibold text-white">Team Portfolio</h3>

            {/* Status Bar */}
            <div className="w-full bg-[#111113] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex h-3 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-strain w-[16%]" />
                    <div className="h-full bg-withdrawal w-[33%]" />
                    <div className="h-full bg-engagement w-[51%]" />
                </div>
                <div className="flex justify-between px-2 text-xs font-mono font-medium opacity-80">
                    <span className="text-strain flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 1 Critical
                    </span>
                    <span className="text-withdrawal flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> 2 At Risk
                    </span>
                    <span className="text-engagement flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 3 Healthy
                    </span>
                </div>
            </div>

            {/* Data Grid */}
            <div className="w-full bg-[#0a0a0b] border border-white/5 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-4 text-xs font-mono uppercase tracking-wider text-slate-500">
                    <div className="col-span-3">Team</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Strain</div>
                    <div className="col-span-1 text-right">Withdrawal</div>
                    <div className="col-span-2 text-right">Trust Gap</div>
                    <div className="col-span-2 text-right">Engagement</div>
                    <div className="col-span-1 text-right">Coverage</div>
                </div>

                <div className="divide-y divide-white/5">
                    {teams.map((team) => (
                        <Link
                            key={team.id}
                            href={`/team/${team.id}`}
                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="col-span-3 font-medium text-slate-200 group-hover:text-white flex items-center gap-2">
                                {team.name}
                                <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                            </div>
                            <div className="col-span-2">
                                <span className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded w-fit border",
                                    team.status === "Critical" && "bg-strain/10 text-strain border-strain/20",
                                    team.status === "At Risk" && "bg-withdrawal/10 text-withdrawal border-withdrawal/20",
                                    team.status === "Healthy" && "bg-engagement/10 text-engagement border-engagement/20",
                                )}>
                                    {team.status === "Critical" && <AlertTriangle className="w-3 h-3" />}
                                    {team.status === "At Risk" && <AlertCircle className="w-3 h-3" />}
                                    {team.status === "Healthy" && <CheckCircle className="w-3 h-3" />}
                                    {team.status}
                                </span>
                            </div>

                            <div className="col-span-1 text-right font-mono text-strain">{team.strain}%</div>
                            <div className="col-span-1 text-right font-mono text-withdrawal">{team.withdrawal}%</div>

                            {/* Trust Gap - User requested "Blue" */}
                            <div className="col-span-2 text-right font-mono text-trust-gap">{team.trust}%</div>

                            <div className="col-span-2 text-right font-mono text-engagement">{team.engagement}%</div>
                            <div className="col-span-1 text-right font-mono text-slate-400">{team.coverage}%</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
