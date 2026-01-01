'use client';

import { shouldUseMocks } from '@/lib/dashboardClient';
import { useEffect, useState } from 'react';

export function MockBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (shouldUseMocks()) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-xs font-bold text-center py-1">
            ⚠ MOCK DATA MODE ENABLED ⚠
        </div>
    );
}
