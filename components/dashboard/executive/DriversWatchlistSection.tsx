import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SystemicDrivers } from './SystemicDrivers';
import { Watchlist } from './Watchlist';
import { DetailCard } from './DetailCard';
import { executiveMockData } from '@/lib/mock/executiveData';

export function DriversWatchlistSection() {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

    const handleDriverSelect = (id: string) => {
        if (selectedDriverId === id) {
            setSelectedDriverId(null);
        } else {
            setSelectedDriverId(id);
            setSelectedWatchlistId(null);
        }
    };

    const handleWatchlistSelect = (id: string) => {
        if (selectedWatchlistId === id) {
            setSelectedWatchlistId(null);
        } else {
            setSelectedWatchlistId(id);
            setSelectedDriverId(null);
        }
    };

    // Determine layout state
    // Default: split-50-50
    // Driver Selected: split-25-75 (Drivers Compact | Driver Detail) -> wait, User said: "narrow the watchlist / systemic driver side to a quarter and making room for the detail card to use three quarters".
    // AND "Keep the Teams... in the watchlist".
    // So if Driver Selected:
    //   Left: Drivers (Compact) 25%
    //   Right: Driver Detail 75%
    //   Watchlist: Hidden

    // If Watchlist Selected:
    //   Left: Watchlist Detail 75% -> Wait, logic check.
    //   User said: "narrow ... side to a quarter ... detail card to use three quarters".
    //   If I click Watchlist (Right side), does it stay on right or move?
    //   "Clicking Watchlist item -> Hide Systemic Drivers -> Reveal Risk Details".
    //   Previous implementation: Left (Risk Detail) | Right (Watchlist).
    //   So if Watchlist Selected:
    //      Left: Risk Detail (75%)
    //      Right: Watchlist (Compact) (25%) -> Drivers Hidden.

    const isDriverActive = !!selectedDriverId;
    const isWatchlistActive = !!selectedWatchlistId;

    return (
        <div className="w-full relative h-[340px] flex gap-6 transition-all duration-500">

            {/* LEFT SIDE: Drivers usually. Or Watchlist Detail if Watchlist Selected. */}

            {/* Logic: 
                If Driver Active: Show Drivers Compact (25%) 
                If Watchlist Active: Show Watchlist Detail (75%)
                Default: Show Drivers (50%)
            */}

            <div className={cn(
                "relative transition-all duration-500 ease-in-out h-full",
                isDriverActive ? "w-[25%]" : isWatchlistActive ? "w-[75%]" : "w-[50%]"
            )}>
                {isWatchlistActive ? (
                    <DetailCard
                        type="watchlist"
                        data={executiveMockData.watchlist.find(w => w.id === selectedWatchlistId)}
                        onClose={() => setSelectedWatchlistId(null)}
                    />
                ) : (
                    <SystemicDrivers
                        selectedId={selectedDriverId || undefined}
                        onSelect={handleDriverSelect}
                        compact={isDriverActive}
                    />
                )}
            </div>

            {/* RIGHT SIDE: Watchlist usually. Or Driver Detail if Driver Selected. */}

            {/* Logic: 
                If Driver Active: Show Driver Detail (75%) 
                If Watchlist Active: Show Watchlist Compact (25%)
                Default: Show Watchlist (50%)
            */}

            <div className={cn(
                "relative transition-all duration-500 ease-in-out h-full",
                isDriverActive ? "w-[75%]" : isWatchlistActive ? "w-[25%]" : "w-[50%]"
            )}>
                {isDriverActive ? (
                    <DetailCard
                        type="driver"
                        data={executiveMockData.drivers.find(d => d.id === selectedDriverId)}
                        onClose={() => setSelectedDriverId(null)}
                    />
                ) : (
                    <Watchlist
                        selectedId={selectedWatchlistId || undefined}
                        onSelect={handleWatchlistSelect}
                        compact={isWatchlistActive}
                    />
                )}
            </div>
        </div>
    );
}
