import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import PageLoader from "@/components/PageLoader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "InPsyq – Psychological Insights for Organizations",
    description: "Deep analytics revealing the emotional drivers of public discourse.",
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className={clsx(inter.variable, "font-sans bg-[#050509] antialiased text-gray-100")}>
                <PageLoader />
                {children}
            </body>
        </html>
    );
}
