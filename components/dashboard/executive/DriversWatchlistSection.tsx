import React, { useState } from 'react';
import { SystemicDrivers } from './SystemicDrivers';
import { Watchlist } from './Watchlist';
import { DetailCard } from './DetailCard';
import { cn } from '@/lib/utils';
import { executiveMockData } from '@/lib/mock/executiveData';

interface DriversWatchlistSectionProps {
    drivers?: any[];
    watchlist?: any[];
}

export function DriversWatchlistSection({ drivers, watchlist }: DriversWatchlistSectionProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

    // Fallback support for Demo Mode / Empty States
    // We hoist this here so DetailCard lookup works on the same dataset as the lists
    const safeDrivers = drivers?.length ? drivers : executiveMockData.drivers;
    const safeWatchlist = watchlist?.length ? watchlist : executiveMockData.watchlist;

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

    // Width Logic
    // Default: 50/50
    // Driver Selected: Left 25%, Right 75%
    // Watchlist Selected: Left 75%, Right 25%

    return (
        <div className="w-full relative h-[400px] flex gap-6">

            {/* Left Column: Drivers OR Risk Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-out",
                selectedWatchlistId ? "w-[75%]" : // Show Risk Detail (Wide)
                    selectedDriverId ? "w-[25%]" :    // Show Driver List (Narrow)
                        "w-[50%]"                         // Default
            )}>
                {selectedWatchlistId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <DetailCard
                            type="watchlist"
                            data={safeWatchlist?.find(w => w.id === selectedWatchlistId)}
                            onClose={() => setSelectedWatchlistId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <SystemicDrivers
                            drivers={safeDrivers}
                            selectedId={selectedDriverId || undefined}
                            onSelect={handleDriverSelect}
                            isCompact={!!selectedDriverId} // Compact if itself is selected
                        />
                    </div>
                )}
            </div>

            {/* Right Column: Watchlist OR Driver Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-out",
                selectedDriverId ? "w-[75%]" :    // Show Driver Detail (Wide)
                    selectedWatchlistId ? "w-[25%]" : // Show Watchlist (Narrow)
                        "w-[50%]"                         // Default
            )}>
                {selectedDriverId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <DetailCard
                            type="driver"
                            data={safeDrivers?.find(d => d.id === selectedDriverId)}
                            onClose={() => setSelectedDriverId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <Watchlist
                            watchlist={safeWatchlist}
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

