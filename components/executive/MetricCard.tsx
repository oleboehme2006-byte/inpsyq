import { ArrowUpRight, ArrowDownRight, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    label: string;
    value: string;
    subValue: string;
    status: "Critical" | "At Risk" | "Watch" | "Moderate" | "Good" | "Stable" | "Minimal" | "Healthy";
    trend: "up" | "down" | "neutral";
    color: "strain" | "withdrawal" | "trust" | "engagement";
    className?: string;
}

export function MetricCard({
    label,
    value,
    subValue,
    status,
    trend,
    color,
    className,
}: MetricCardProps) {
    // Map color prop to strict Tailwind classes based on our config
    const colorMap = {
        strain: "text-strain border-strain/30",
        withdrawal: "text-withdrawal border-withdrawal/30",
        trust: "text-trust-gap border-trust-gap/30",
        engagement: "text-engagement border-engagement/30",
    };

    const badgeColorMap = {
        strain: "bg-strain/10 text-strain border-strain/20",
        withdrawal: "bg-withdrawal/10 text-withdrawal border-withdrawal/20",
        trust: "bg-trust-gap/10 text-trust-gap border-trust-gap/20",
        engagement: "bg-engagement/10 text-engagement border-engagement/20",
    };

    const glowMap = {
        strain: "shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]",
        withdrawal: "shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]",
        trust: "shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]",
        engagement: "shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]",
    };

    const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

    return (
        <div
            className={cn(
                "relative p-6 rounded-xl bg-[#0a0a0b] border transition-all duration-300",
                "hover:scale-[1.02]",
                color === "engagement" ? "border-engagement" : "border-white/5", // Engagement gets full border in screenshot
                color === "engagement" ? glowMap.engagement : "",
                className
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    {label}
                </span>
                {color === "trust" && <Check className="w-4 h-4 text-trust-gap" />}
            </div>

            <div className="flex items-baseline gap-3 mt-4">
                <span className={cn("text-5xl font-light tracking-tight", colorMap[color].split(" ")[0])}>
                    {value}
                </span>
                <span
                    className={cn(
                        "px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border",
                        badgeColorMap[color]
                    )}
                >
                    {status}
                </span>
            </div>

            <div className="flex items-center gap-1 mt-2 text-slate-400 text-sm font-mono">
                <span>{subValue}</span>
            </div>
        </div>
    );
}
