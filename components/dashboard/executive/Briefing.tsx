import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Clock } from 'lucide-react';

interface BriefingProps {
    paragraphs?: string[];
}

export function Briefing({ paragraphs }: BriefingProps) {
    const hasDynamicContent = paragraphs && paragraphs.length > 0;

    return (
        <div className="w-full p-6 rounded-xl border border-white/10 bg-[#050505] flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-medium text-white">Briefing</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#845EEE]/10 border border-[#845EEE]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#845EEE] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[#845EEE] uppercase tracking-widest">LLM-Supported</span>
                </div>
            </div>

            {/* Content - Two Column "Paper" Layout */}
            <div className="prose prose-invert max-w-none block space-y-4 columns-1 md:columns-2 gap-12 font-body text-sm text-text-secondary leading-relaxed text-justify">
                {hasDynamicContent ? (
                    paragraphs.map((para, i) => (
                        <p
                            key={i}
                            className={cn("break-inside-avoid-column", i < paragraphs.length - 1 && "mb-4")}
                            dangerouslySetInnerHTML={{ __html: para }}
                        />
                    ))
                ) : (
                    <>
                        <p className="break-inside-avoid-column mb-4">
                            Organization-wide strain has intensified by <span className="text-strain">12%</span> week-over-week, a trajectory primarily driven by critical workload saturation within the <span className="text-white">Product</span> and <span className="text-white">Engineering</span> teams. This localized pressure is creating a downstream bottleneck, evidenced by a 15% increase in cross-functional friction and early signals of withdrawal in dependent units like Support. While the Sales and HR departments remain stable—indicating that cultural fundamentals are intact—the operational stress in technical divisions is reaching a tipping point that threatens Q4 delivery timelines.
                        </p>
                        <p className="break-inside-avoid-column mb-4">
                            Contrasting this localized volatility, the &quot;Cultural Core&quot; remains remarkably stable. Sales and HR engagement scores have trended upward (+3%) alongside the technical strain, confirming that the stressors are strictly operational (process/workload) rather than systemic (values/mission). This isolation of risk is a strategic advantage, allowing leadership to apply surgical interventions to Product/Engineering without fearing a wider contagion effect across the commercial functions.
                        </p>
                        <p className="break-inside-avoid-column mb-4">
                            Causality analysis suggests that recent scope expansion, without clear resource adjustment, is the root cause of this acceleration. Historical patterns indicate that teams operating at this strain level for more than 3 weeks face a <span className="text-white">70% probability</span> of elevated attrition. The current window for cost-effective intervention is approximately 14 days before burnout becomes structural. Notably, the interaction effect between Product delays and Engineering overtime is amplifying the &quot;perceived chaos&quot; metric, which has jumped by 22% in the last sprint interaction analysis.
                        </p>
                        <p className="break-inside-avoid-column">
                            <span className="text-white font-medium">Recommendation:</span> Immediate executive intervention is advised to rebalance resource allocation. A temporary &quot;scope freeze&quot; on non-critical initiatives is recommended to stabilize the core delivery engine. Furthermore, recognizing the Resilience Score of the Support team, despite the upstream pressure, could serve as a vital morale booster while structural optimizations are implemented. The focus must shift from &quot;velocity&quot; to &quot;stability&quot; for the remainder of the current cycle.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

