import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface ActionWidgetProps {
    actions: any[];
}

export function ActionWidget({ actions }: ActionWidgetProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold text-text-primary">Actions</h3>
                <span className="text-xs font-mono text-text-tertiary">Priority</span>
            </div>

            <div className="space-y-4">
                {actions.map((action, idx) => (
                    <div key={idx} className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                        "bg-bg-surface/30 backdrop-blur-sm hover:bg-bg-surface/50",
                        // Border color based on priority/color logic from mock
                        action.color === 'strain' ? "border-l-4 border-l-strain border-strain/30" :
                            action.color === 'withdrawal' ? "border-l-4 border-l-withdrawal border-withdrawal/30" :
                                "border-l-4 border-l-meta border-meta/30"
                    )}>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-text-primary">{action.label}</span>
                                <div className={cn("flex items-center gap-1 text-[10px] font-mono font-bold uppercase",
                                    action.color === 'strain' ? "text-strain" :
                                        action.color === 'withdrawal' ? "text-withdrawal" : "text-meta"
                                )}>
                                    {action.priority === 'IMMEDIATE' && <AlertCircle className="w-3 h-3" />}
                                    {action.priority === 'HIGH' && <Clock className="w-3 h-3" />}
                                    {action.priority === 'NORMAL' && <CheckCircle className="w-3 h-3" />}
                                    <span>{action.priority}</span>
                                </div>
                            </div>
                            <p className="text-xs text-text-secondary">{action.description}</p>
                        </div>
                    </div>
                ))}

                <p className="text-xs text-text-tertiary mt-4">
                    Click above for details
                </p>
            </div>
        </div>
    );
}
