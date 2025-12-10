import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)'],
            },
            colors: {
                background: "#050509",
                surface: {
                    dark: "#0B0F17",
                    card: "#0F172A",
                },
                accent: {
                    primary: "#6366F1", // Deep blue-violet
                    secondary: "#22D3EE", // Cyan/turquoise
                },
                text: {
                    main: "#E5E7EB",
                    muted: "#9CA3AF",
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
