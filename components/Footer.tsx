import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#020205] py-12 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <Link href="/" className="text-2xl font-bold text-white tracking-tight hover:text-accent-primary transition-colors">
                            InPsyQ
                        </Link>
                        <p className="text-text-muted text-sm mt-2">
                            Social Sentiment. Data-Driven Depth. Psychological Insights.
                        </p>
                    </div>

                    <div className="flex gap-8 text-sm text-text-muted">
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Imprint</a>
                    </div>
                </div>
                <div className="mt-12 text-center text-xs text-text-muted/50">
                    © {new Date().getFullYear()} InPsyQ Analytics. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
