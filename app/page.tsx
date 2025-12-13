import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import UseCasesSection from "@/components/UseCasesSection";
import SampleReportSection from "@/components/SampleReportSection";
import Footer from "@/components/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";

import ExplainerSection from "@/components/ExplainerSection";

export default function Home() {
    return (
        <main className="relative min-h-screen overflow-x-hidden selection:bg-accent-primary/30">
            <BackgroundEffects />
            <Navbar />
            <Hero />
            <ProblemSection />
            <SolutionSection />
            <HowItWorks />
            <FeaturesSection />
            <UseCasesSection />
            <ExplainerSection />
            <SampleReportSection />
            <Footer />
        </main>
    );
}
