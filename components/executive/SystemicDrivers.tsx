"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

// ==========================================
// SYSTEMIC DRIVERS
// ==========================================

const drivers = [
    { name: "Workload Pressure", type: "organization", score: 65, color: "bg-strain" },
    { name: "Process Friction", type: "department", score: 48, color: "bg-strain" }, // Screenshot shows pink/red
    { name: "Communication Gaps", type: "localized", score: 38, color: "bg-strain" },
];

export function SystemicDrivers() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Systemic Drivers</h3>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Influence</span>
            </div>

            <div className="space-y-4">
                {drivers.map((driver) => (
                    <div key={driver.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-200">{driver.name}</span>
                            <span className={cn(
                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-slate-400",
                                driver.type === "organization" && "text-red-400 border-red-900/30 bg-red-900/10",
                                driver.type === "department" && "text-orange-400 border-orange-900/30 bg-orange-900/10",
                                driver.type === "localized" && "text-blue-400 border-blue-900/30 bg-blue-900/10",
                            )}>
                                {driver.type}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden flex items-center justify-between">
                            <div className={cn("h-full rounded-full", driver.color)} style={{ width: `${driver.score}%` }} />
                        </div>
                        <div className="w-full text-right text-xs font-mono text-strain/80">
                            {driver.score}%
                        </div>
                    </div>
                ))}
            </div>
            <button className="text-xs text-slate-500 hover:text-white transition-colors mt-2">
                Show 2 more
            </button>
        </div>
    );
}

// ==========================================
// WATCHLIST
// ==========================================

const watchlist = [
    { name: "Product", desc: "Critical strain with accelerating decline", criticality: 68, status: "Critical" },
    { name: "Engineering", desc: "Workload pressure trending upward", criticality: 52, status: "At Risk" },
    { name: "Support", desc: "Engagement decline detected", criticality: 42, status: "Watch" },
];

export function Watchlist() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Watchlist</h3>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Criticality</span>
            </div>

            <div className="space-y-3">
                {watchlist.map(item => (
                    <div
                        key={item.name}
                        className={cn(
                            "relative flex items-start justify-between p-4 rounded-lg border border-l-4 transition-all hover:bg-[#18181b]",
                            item.status === "Critical" && "bg-strain/5 border-white/5 border-l-strain",
                            item.status === "At Risk" && "bg-withdrawal/5 border-white/5 border-l-withdrawal",
                            item.status === "Watch" && "bg-[#18181b] border-white/5 border-l-trust-engagement", // Wait, screenshot has purple icon for support
                        )}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium text-slate-200">
                                {item.status === "Critical" && <AlertTriangle className="w-4 h-4 text-strain" />}
                                {item.status === "At Risk" && <AlertCircle className="w-4 h-4 text-withdrawal" />}
                                {item.status === "Watch" && <Info className="w-4 h-4 text-purple-500" />} {/* Support icon is purple in screenshot */}
                                {item.name}
                            </div>
                            <p className="text-sm text-slate-400">{item.desc}</p>
                        </div>
                        <span className={cn(
                            "text-sm font-mono font-bold",
                            item.status === "Critical" ? "text-strain" :
                                item.status === "At Risk" ? "text-withdrawal" : "text-purple-500"
                        )}>
                            {item.criticality}%
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-slate-500">Click above for details</p>
        </div>
    )
}
