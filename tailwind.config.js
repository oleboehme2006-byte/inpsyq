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
                    base: 'var(--bg-base)',
                    elevated: 'var(--bg-elevated)',
                    surface: 'var(--bg-surface)',
                    hover: 'var(--bg-hover)',
                },

                // Text Hierarchy
                'text': {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                },

                // Semantic: Strain (Red/Neon)
                'strain': {
                    DEFAULT: 'var(--color-strain)',
                    dim: 'var(--color-strain-dim)',
                    muted: 'var(--color-strain-dim)',
                    high: 'var(--color-strain)',
                },

                // Semantic: Withdrawal (Orange/Neon)
                'withdrawal': {
                    DEFAULT: 'var(--color-withdrawal)',
                    dim: 'var(--color-withdrawal-dim)',
                    muted: 'var(--color-withdrawal-dim)',
                    high: 'var(--color-withdrawal)',
                },

                // Semantic: Trust Gap (Blue/Neon)
                'trust-gap': {
                    DEFAULT: 'var(--color-trust)',
                    dim: 'var(--color-trust-dim)',
                    muted: 'var(--color-trust-dim)',
                    high: 'var(--color-trust)',
                },

                // Semantic: Engagement (Green/Neon)
                'engagement': {
                    DEFAULT: 'var(--color-engagement)',
                    dim: 'var(--color-engagement-dim)',
                    muted: 'var(--color-engagement-dim)',
                    high: 'var(--color-engagement)',
                },

                // Borders
                'border': {
                    DEFAULT: 'var(--border)',
                    highlight: 'var(--border-highlight)',
                },

                // UI Accents
                'accent': {
                    primary: '#8b5cf6',        // Violet
                    secondary: '#06b6d4',      // Cyan
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
