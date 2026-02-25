'use client';

import React, { createContext, useContext, useState } from 'react';
import type { Lang } from '@/lib/landing/content';

interface LanguageContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
    lang: 'EN',
    setLang: () => {},
});

function detectDefaultLang(): Lang {
    if (typeof navigator === 'undefined') return 'EN';
    return navigator.language.startsWith('de') ? 'DE' : 'EN';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Lang>(detectDefaultLang);
    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    return useContext(LanguageContext);
}
