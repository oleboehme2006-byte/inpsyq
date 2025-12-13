import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
    return (
        <footer className="bg-[#020205] py-12 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <Link href="/" className="text-white hover:text-accent-primary transition-colors inline-block">
                            <BrandLogo className="text-white text-2xl" />
                        </Link>
                        <p className="text-text-muted text-sm mt-4 max-w-md leading-relaxed">
                            InPsyq operates at the frontier of organizational psychology modeling —
                            combining probabilistic inference, explainability, and aggregation-first privacy by design.
                        </p>
                    </div>

                    <div className="flex gap-8 text-sm text-text-muted">
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Imprint</a>
                    </div>
                </div>
                <div className="mt-12 text-center text-xs text-text-muted/50">
                    © {new Date().getFullYear()} InPsyq Analytics. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
