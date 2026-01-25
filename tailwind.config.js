/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ==========================================
            // TYPOGRAPHY
            // ==========================================
            fontFamily: {
                // Logo / Main Titles
                display: ['DM Sans', 'system-ui', 'sans-serif'],
                // Body Text
                body: ['Inter', 'system-ui', 'sans-serif'],
                // Technical / Meta
                mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                // Minimum 14px enforced
                'xs': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px (minimum)
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
                'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
                '5xl': ['3rem', { lineHeight: '1' }],             // 48px
                '6xl': ['3.75rem', { lineHeight: '1' }],          // 60px
            },
            fontWeight: {
                light: '300',
                normal: '400',
                medium: '500',
                semibold: '600',
            },

            // ==========================================
            // SEMANTIC COLOR SYSTEM
            // ==========================================
            colors: {
                // Background Layers
                'bg': {
                    base: '#0a0a0b',          // Near-black
                    elevated: '#111113',       // Slightly lighter
                    surface: '#18181b',        // Card backgrounds
                    hover: '#27272a',          // Hover states
                },

                // Text Hierarchy
                'text': {
                    primary: '#f8fafc',        // White/light
                    secondary: '#94a3b8',      // Muted
                    tertiary: '#64748b',       // Very muted
                    inverse: '#0a0a0b',        // Dark on light
                },

                // Semantic: Strain/Load (higher = worse) - Red → Magenta
                'strain': {
                    low: '#22c55e',            // Good - green
                    DEFAULT: '#ef4444',        // Elevated - red
                    high: '#db2777',           // Critical - magenta
                    muted: 'rgba(239, 68, 68, 0.15)',
                },

                // Semantic: Withdrawal Risk (higher = worse) - Orange
                'withdrawal': {
                    low: '#22c55e',            // Good
                    DEFAULT: '#f97316',        // Elevated - orange-500
                    high: '#ea580c',           // Critical - orange-600
                    muted: 'rgba(249, 115, 22, 0.15)',
                },

                // Semantic: Trust Gap (higher = worse) - Blue
                'trust-gap': {
                    low: '#22c55e',            // Good
                    DEFAULT: '#3b82f6',        // Elevated - blue-500
                    high: '#2563eb',           // Critical - blue-600
                    muted: 'rgba(59, 130, 246, 0.15)',
                },

                // Semantic: Engagement (higher = better) - Green
                'engagement': {
                    low: '#ef4444',            // Bad - red
                    DEFAULT: '#22c55e',        // Good - green-500
                    high: '#16a34a',           // Excellent - green-600
                    muted: 'rgba(34, 197, 94, 0.15)',
                },

                // Semantic: Meta/Confidence - Violet
                'meta': {
                    DEFAULT: '#8b5cf6',        // Violet
                    low: '#6366f1',            // Indigo (low confidence)
                    high: '#a855f7',           // Purple (high confidence)
                    muted: 'rgba(139, 92, 246, 0.15)',
                },

                // UI Accents
                'accent': {
                    primary: '#8b5cf6',        // Violet
                    secondary: '#06b6d4',      // Cyan
                },

                // State Colors (universal)
                'state': {
                    success: '#22c55e',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                },

                // Borders
                'border': {
                    DEFAULT: '#27272a',
                    subtle: '#1f1f23',
                    accent: '#3f3f46',
                },
            },

            // ==========================================
            // SPACING & LAYOUT
            // ==========================================
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },

            // ==========================================
            // SHADOWS & EFFECTS
            // ==========================================
            boxShadow: {
                'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
                'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
                'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
            },

            // ==========================================
            // ANIMATIONS
            // ==========================================
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'drift': 'drift 20s ease-in-out infinite',
                'float': 'float 8s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                drift: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(20px, -10px) scale(1.05)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },

            // ==========================================
            // TRANSITIONS
            // ==========================================
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },

            // ==========================================
            // BLUR
            // ==========================================
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
};
