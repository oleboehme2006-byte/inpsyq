'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageToggle() {
    const { lang, setLang } = useLanguage();

    return (
        <button
            onClick={() => setLang(lang === 'EN' ? 'DE' : 'EN')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-mono text-text-secondary"
            aria-label="Toggle language"
        >
            <span className={cn('transition-colors', lang === 'EN' ? 'text-white font-medium' : '')}>EN</span>
            <span className="text-white/20">/</span>
            <span className={cn('transition-colors', lang === 'DE' ? 'text-white font-medium' : '')}>DE</span>
        </button>
    );
}
