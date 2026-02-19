import React, { useState } from 'react';
import { SystemicDrivers } from './SystemicDrivers';
import { Watchlist } from './Watchlist';
import { DetailCard } from './DetailCard';
import { cn } from '@/lib/utils';

interface DriversWatchlistSectionProps {
    drivers?: any[];
    watchlist?: any[];
}

export function DriversWatchlistSection({ drivers, watchlist }: DriversWatchlistSectionProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

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
            <div className={cn("h-full relative transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                selectedWatchlistId ? "w-[75%]" : // Show Risk Detail (Wide)
                    selectedDriverId ? "w-[25%]" :    // Show Driver List (Narrow)
                        "w-[50%]"                         // Default
            )}>
                {selectedWatchlistId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <DetailCard
                            type="watchlist"
                            data={watchlist?.find(w => w.id === selectedWatchlistId)}
                            onClose={() => setSelectedWatchlistId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <SystemicDrivers
                            drivers={drivers}
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
                            data={drivers?.find(d => d.id === selectedDriverId)}
                            onClose={() => setSelectedDriverId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <Watchlist
                            watchlist={watchlist}
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

