import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "InPsyQ - Social Sentiment & Psychological Insights",
    description: "Deep analytics revealing the emotional drivers of public discourse.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className={clsx(inter.variable, "font-sans bg-[#050509] antialiased text-gray-100")}>
                {children}
            </body>
        </html>
    );
}
