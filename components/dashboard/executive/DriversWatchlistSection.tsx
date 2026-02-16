import React, { useState } from 'react';
import { SystemicDrivers } from './SystemicDrivers';
import { Watchlist } from './Watchlist';
import { DetailCard } from './DetailCard';
import { cn } from '@/lib/utils';
import { ExecutiveDashboardData } from '@/services/dashboard/executiveReader';

interface DriversWatchlistSectionProps {
    systemicDrivers: ExecutiveDashboardData['systemicDrivers'];
    watchlist: ExecutiveDashboardData['watchlist'];
}

export function DriversWatchlistSection({ systemicDrivers, watchlist }: DriversWatchlistSectionProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

    const driversUI = systemicDrivers.map(d => ({
        id: d.driverFamily,
        label: d.driverFamily.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        scope: d.affectedTeams > 1 ? 'Organization' : 'Department',
        score: Math.round(Math.min(100, (d.aggregateImpact || d.affectedTeams * 25))), // Heuristic score
        details: {
            mechanism: "Systemic pattern detected across multiple teams.",
            influence: "High correlation with strain indices.",
            measurement: "Aggregated weekly measurements.",
            model_confidence: "High",
            context: "Observed in recent data aggregation.",
            causality: "Derived from user feedback and latent state changes.",
            effects: "Potential for decreased engagement if unaddressed.",
            recommendation: "Review driver impact with team leads."
        }
    }));

    const watchlistUI = watchlist.map(w => ({
        id: w.teamId,
        team: w.teamName,
        severity: (w.severity > 70 ? 'critical' : w.severity > 40 ? 'warning' : 'info') as 'critical' | 'warning' | 'info',
        message: w.reason,
        details: {
            context: w.reason,
            causality: "Triggered by threshold violation.",
            effects: "Risk of local burnout or disengagement.",
            recommendation: "Investigate team specific stressors."
        }
    }));

    const handleDriverSelect = (id: string) => {
        if (selectedDriverId === id) {
            setSelectedDriverId(null);
        } else {
            setSelectedDriverId(id);
            setSelectedWatchlistId(null); // Clear other side
        }
    };

    const handleWatchlistSelect = (id: string) => {
        if (selectedWatchlistId === id) {
            setSelectedWatchlistId(null);
        } else {
            setSelectedWatchlistId(id);
            setSelectedDriverId(null); // Clear other side
        }
    };

    return (
        <div className="w-full relative h-[400px] flex gap-6">

            {/* Left Column: Drivers OR Risk Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                selectedWatchlistId ? "w-[75%]" : // Show Risk Detail (Wide)
                    selectedDriverId ? "w-[25%]" :    // Show Driver List (Narrow)
                        "w-[50%]"                         // Default
            )}>
                {selectedWatchlistId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <DetailCard
                            type="watchlist"
                            data={watchlistUI.find(w => w.id === selectedWatchlistId)}
                            onClose={() => setSelectedWatchlistId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <SystemicDrivers
                            drivers={driversUI}
                            selectedId={selectedDriverId || undefined}
                            onSelect={handleDriverSelect}
                            isCompact={!!selectedDriverId} // Compact if itself is selected
                        />
                    </div>
                )}
            </div>

            {/* Right Column: Watchlist OR Driver Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                selectedDriverId ? "w-[75%]" :    // Show Driver Detail (Wide)
                    selectedWatchlistId ? "w-[25%]" : // Show Watchlist (Narrow)
                        "w-[50%]"                         // Default
            )}>
                {selectedDriverId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <DetailCard
                            type="driver"
                            data={driversUI.find(d => d.id === selectedDriverId)}
                            onClose={() => setSelectedDriverId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <Watchlist
                            items={watchlistUI}
                            selectedId={selectedWatchlistId || undefined}
                            onSelect={handleWatchlistSelect}
                            isCompact={!!selectedWatchlistId} // Compact if itself is selected
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
