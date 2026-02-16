/**
 * Privacy Policy Page
 * 
 * Static, no tracking, B2B-focused.
 * InPsyq acts as DATA PROCESSOR, customers as DATA CONTROLLERS.
 */

import { PageShell } from '@/components/shared/PageShell';

export const metadata = {
    title: 'Privacy Policy | inPsyq',
    description: 'inPsyq privacy policy for B2B customers.',
};

export default function PrivacyPage() {
    return (
        <PageShell>
            <h1>Privacy Policy</h1>
            <p className="text-sm text-text-tertiary">Last updated: January 2026</p>

            <h2>1. Introduction</h2>
            <p>
                InPsyq (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides team wellbeing analytics
                services to business customers. This Privacy Policy explains how we process
                personal data when providing our services.
            </p>

            <h2>2. Roles and Responsibilities</h2>
            <p>
                <strong>Your organization (the Customer)</strong> is the <em>Data Controller</em>.
                The Customer determines the purposes and means of processing employee data.
            </p>
            <p>
                <strong>InPsyq</strong> acts as a <em>Data Processor</em> on behalf of the Customer.
                We process personal data only as instructed by the Customer and in accordance
                with our Data Processing Agreement (DPA).
            </p>

            <h2>3. Data Categories Processed</h2>
            <ul>
                <li><strong>Account Data:</strong> Name, email address, organization membership</li>
                <li><strong>Session Data:</strong> Responses to wellbeing questions</li>
                <li><strong>Derived Metrics:</strong> Team-level aggregated indices</li>
                <li><strong>Technical Data:</strong> Timestamps, session identifiers</li>
            </ul>

            <h2>4. Purpose of Processing</h2>
            <p>
                We process personal data solely to provide the contracted services:
            </p>
            <ul>
                <li>Collecting and analyzing employee wellbeing responses</li>
                <li>Generating aggregated team insights</li>
                <li>Providing dashboards to authorized organization members</li>
            </ul>

            <h2>5. Data Retention</h2>
            <ul>
                <li><strong>Session response data:</strong> 12 months from collection</li>
                <li><strong>Aggregated metrics:</strong> Retained (non-identifiable)</li>
                <li><strong>Invite tokens:</strong> 72 hours (auto-expire)</li>
                <li><strong>Audit logs:</strong> 24 months</li>
            </ul>

            <h2>6. Subprocessors</h2>
            <p>We use the following subprocessors:</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-2 pr-4 text-text-tertiary font-mono text-[10px] uppercase tracking-widest">Provider</th>
                            <th className="text-left py-2 pr-4 text-text-tertiary font-mono text-[10px] uppercase tracking-widest">Purpose</th>
                            <th className="text-left py-2 text-text-tertiary font-mono text-[10px] uppercase tracking-widest">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <tr>
                            <td className="py-2 pr-4">Vercel Inc.</td>
                            <td className="py-2 pr-4">Hosting, CDN</td>
                            <td className="py-2">USA (EU data region)</td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-4">Neon Inc.</td>
                            <td className="py-2 pr-4">Database hosting</td>
                            <td className="py-2">EU (Frankfurt)</td>
                        </tr>
                        <tr>
                            <td className="py-2 pr-4">OpenAI</td>
                            <td className="py-2 pr-4">LLM interpretation (optional)</td>
                            <td className="py-2">USA</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>7. Data Subject Rights</h2>
            <p>
                Employees have rights under GDPR including access, rectification, erasure,
                and data portability. Requests should be directed to your employer
                (the Data Controller), who will coordinate with us as needed.
            </p>

            <h2>8. Security</h2>
            <p>
                We implement technical and organizational measures to protect personal data,
                including encryption in transit and at rest, access controls, and regular
                security assessments.
            </p>

            <h2>9. Contact</h2>
            <p>
                For privacy-related inquiries, contact us at: privacy@inpsyq.com
            </p>

            <hr className="my-8 border-white/10" />
            <p className="text-xs text-text-tertiary">
                This policy applies to InPsyq B2B services. Consumers are not our direct customers.
            </p>
        </PageShell>
    );
}
