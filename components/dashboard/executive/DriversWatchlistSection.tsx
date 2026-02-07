import React, { useState } from 'react';
import { SystemicDrivers } from './SystemicDrivers';
import { Watchlist } from './Watchlist';
import { DetailCard } from './DetailCard';
import { executiveMockData } from '@/lib/mock/executiveData';
import { cn } from '@/lib/utils';

export function DriversWatchlistSection() {
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

    // Note: DetailCard appears ON TOP of the *inactive* side in the user's previous request ("overlay"), 
    // but the new request says "narrow... making room".
    // "As soon as a card is clicked... narrow the width of the watchlist / systemic driver side to a quarter and making room for the detail card to use three quarters."

    // If Driver Selected (Left):
    // List (Drivers) should narrow to 25%.
    // Detail (Right) should expand to 75%. (Watchlist is hidden/replaced by Detail)

    // If Watchlist Selected (Right):
    // Detail (Left) should expand to 75%. (Drivers is hidden/replaced by Detail)
    // List (Watchlist) should narrow to 25%.

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
                            data={executiveMockData.watchlist.find(w => w.id === selectedWatchlistId)}
                            onClose={() => setSelectedWatchlistId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <SystemicDrivers
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
                            data={executiveMockData.drivers.find(d => d.id === selectedDriverId)}
                            onClose={() => setSelectedDriverId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <Watchlist
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
