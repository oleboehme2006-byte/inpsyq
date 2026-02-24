import React, { useState } from 'react';
import { InternalDrivers } from './InternalDrivers';
import { Actions } from './Actions';
import { TeamDetailCard } from './TeamDetailCard';
import { TeamDriver, TeamAction } from '@/lib/mock/teamDashboardData';
import { cn } from '@/lib/utils';

interface DriversActionsSectionProps {
    drivers: TeamDriver[];
    actions: TeamAction[];
}

export function DriversActionsSection({ drivers, actions }: DriversActionsSectionProps) {
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

    const handleDriverSelect = (id: string) => {
        if (selectedDriverId === id) {
            setSelectedDriverId(null);
        } else {
            setSelectedDriverId(id);
            setSelectedActionId(null);
        }
    };

    const handleActionSelect = (id: string) => {
        if (selectedActionId === id) {
            setSelectedActionId(null);
        } else {
            setSelectedActionId(id);
            setSelectedDriverId(null);
        }
    };

    return (
        <div className="w-full relative h-[400px] flex gap-6">

            {/* Left Column: Drivers OR Action Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-out",
                selectedActionId ? "w-[75%]" :
                    selectedDriverId ? "w-[25%]" :
                        "w-[50%]"
            )}>
                {selectedActionId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <TeamDetailCard
                            type="action"
                            data={actions.find(a => a.id === selectedActionId)}
                            onClose={() => setSelectedActionId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <InternalDrivers
                            drivers={drivers}
                            selectedId={selectedDriverId || undefined}
                            onSelect={handleDriverSelect}
                            isCompact={!!selectedDriverId}
                        />
                    </div>
                )}
            </div>

            {/* Right Column: Actions OR Driver Detail */}
            <div className={cn("h-full relative transition-all duration-700 ease-out",
                selectedDriverId ? "w-[75%]" :
                    selectedActionId ? "w-[25%]" :
                        "w-[50%]"
            )}>
                {selectedDriverId ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                        <TeamDetailCard
                            type="driver"
                            data={drivers.find(d => d.id === selectedDriverId)}
                            onClose={() => setSelectedDriverId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full">
                        <Actions
                            actions={actions}
                            selectedId={selectedActionId || undefined}
                            onSelect={handleActionSelect}
                            isCompact={!!selectedActionId}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
