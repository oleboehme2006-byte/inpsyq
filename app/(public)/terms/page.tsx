/**
 * Terms of Service Page
 * 
 * B2B SaaS terms. No consumer wording.
 * References Privacy Policy and DPA.
 */

export const metadata = {
    title: 'Terms of Service | InPsyq',
    description: 'InPsyq terms of service for B2B customers.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 py-16 px-6" data-testid="terms-page">
            <div className="max-w-3xl mx-auto prose prose-slate">
                <h1>Terms of Service</h1>
                <p className="text-sm text-slate-500">Last updated: January 2026</p>

                <h2>1. Scope and Parties</h2>
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern the use of InPsyq services
                    by business customers (&quot;Customer&quot;, &quot;you&quot;). InPsyq is provided
                    by InPsyq GmbH (&quot;InPsyq&quot;, &quot;we&quot;, &quot;us&quot;).
                </p>
                <p>
                    <strong>These Terms apply only to B2B relationships.</strong> InPsyq does not
                    offer services directly to consumers.
                </p>

                <h2>2. Service Description</h2>
                <p>
                    InPsyq provides a SaaS platform for team wellbeing analytics. The platform
                    enables organizations to collect employee feedback, generate aggregated insights,
                    and access dashboards for authorized users.
                </p>

                <h2>3. Customer Obligations</h2>
                <ul>
                    <li>Provide accurate registration information</li>
                    <li>Maintain confidentiality of access credentials</li>
                    <li>Ensure lawful basis for processing employee data (as Data Controller)</li>
                    <li>Inform employees about data processing</li>
                    <li>Use the service in compliance with applicable laws</li>
                </ul>

                <h2>4. Subscription and Payment</h2>
                <p>
                    Service fees are specified in the Order Form. Payment terms are Net 30 days
                    from invoice date. Late payments may incur interest at the statutory rate.
                </p>

                <h2>5. Data Processing</h2>
                <p>
                    Data processing is governed by our <a href="/privacy">Privacy Policy</a> and
                    the Data Processing Agreement (DPA) executed between the parties.
                    The Customer remains the Data Controller; InPsyq acts as Data Processor.
                </p>

                <h2>6. Intellectual Property</h2>
                <p>
                    InPsyq retains all intellectual property rights in the platform, methodology,
                    and aggregated, anonymized insights. Customer retains rights to their raw data.
                </p>

                <h2>7. Confidentiality</h2>
                <p>
                    Both parties agree to maintain the confidentiality of proprietary information
                    disclosed during the business relationship.
                </p>

                <h2>8. Warranty and Liability</h2>
                <p>
                    InPsyq provides the service &quot;as is&quot; with commercially reasonable efforts
                    to maintain availability and security. Liability is limited to the fees paid
                    in the 12 months preceding the claim, except for gross negligence or willful misconduct.
                </p>

                <h2>9. Term and Termination</h2>
                <p>
                    The initial term is specified in the Order Form. Either party may terminate
                    with 30 days written notice at the end of any subscription period.
                    Upon termination, Customer may request data export within 30 days.
                </p>

                <h2>10. Governing Law</h2>
                <p>
                    These Terms are governed by the laws of Germany. The courts of [City] shall
                    have exclusive jurisdiction.
                </p>

                <h2>11. Amendments</h2>
                <p>
                    We may update these Terms with 30 days notice. Continued use after the
                    effective date constitutes acceptance. Material changes require explicit consent.
                </p>

                <h2>12. Contact</h2>
                <p>
                    For questions regarding these Terms: legal@inpsyq.com
                </p>

                <hr className="my-8" />
                <p className="text-xs text-slate-400">
                    These Terms apply to B2B SaaS services only. Consumer protection laws do not apply.
                </p>
            </div>
        </div>
    );
}
