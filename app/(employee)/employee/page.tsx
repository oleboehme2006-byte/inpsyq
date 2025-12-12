import BrandLogo from '@/components/shared/BrandLogo';
import Link from 'next/link';

export default function EmployeePage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="mb-12 flex items-center justify-between">
                <BrandLogo />
                <div className="text-sm text-gray-500">Employee Portal</div>
            </header>

            <main className="max-w-2xl mx-auto space-y-8">
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-light mb-4">Weekly Session</h2>
                    <p className="text-gray-600 mb-6">
                        Your insights help shape the organizational rhythm.
                        All responses are encoded and anonymized.
                    </p>
                    <Link
                        href="/employee/session"
                        className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                        Start Session
                    </Link>
                </section>

                <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-light mb-4">Private Feedback</h2>
                    <p className="text-gray-600 mb-6">
                        Share observations directly with the aggregation layer.
                        Completely decoupled from your profile.
                    </p>
                    <Link
                        href="/employee/feedback"
                        className="inline-block border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                        Submit Feedback
                    </Link>
                </section>
            </main>
        </div>
    );
}
