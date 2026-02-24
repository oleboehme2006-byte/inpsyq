'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
    const [lang, setLang] = useState<'EN' | 'DE'>('EN');

    const toggleLang = () => {
        setLang((prev) => (prev === 'EN' ? 'DE' : 'EN'));
        // In a real i18n setup, this would trigger a router push or locale change.
        if (lang === 'EN') {
            console.log("Switching to German (Mock)");
        } else {
            console.log("Switching to English (Mock)");
        }
    };

    return (
        <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-mono text-text-secondary"
            aria-label="Toggle language"
        >
            <span className={cn("transition-colors", lang === 'EN' ? "text-white font-medium" : "")}>EN</span>
            <span className="text-white/20">/</span>
            <span className={cn("transition-colors", lang === 'DE' ? "text-white font-medium" : "")}>DE</span>
        </button>
    );
}
