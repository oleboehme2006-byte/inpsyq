/**
 * Imprint Page (Impressum)
 * 
 * EU-compliant legal disclosure.
 * Static, no tracking.
 */

import { PageShell } from '@/components/shared/PageShell';

export const metadata = {
    title: 'Imprint | inPsyq',
    description: 'Legal imprint for inPsyq.',
};

export default function ImprintPage() {
    return (
        <PageShell>
            <h1>Imprint (Impressum)</h1>

            <h2>Information according to § 5 TMG</h2>
            <p>
                <strong>InPsyq GmbH</strong><br />
                [Address Placeholder]<br />
                [City, Country]
            </p>

            <h2>Represented by</h2>
            <p>
                Managing Director: [Name Placeholder]
            </p>

            <h2>Contact</h2>
            <p>
                Email: contact@inpsyq.com<br />
                Phone: [Phone Placeholder]
            </p>

            <h2>Registration</h2>
            <p>
                Commercial Register: [Court Placeholder]<br />
                Registration Number: HRB [Number Placeholder]
            </p>

            <h2>VAT Identification Number</h2>
            <p>
                VAT ID according to § 27a UStG: [VAT ID Placeholder]
            </p>

            <h2>Responsible for Content</h2>
            <p>
                According to § 55 Abs. 2 RStV:<br />
                [Name Placeholder]<br />
                [Address Placeholder]
            </p>

            <h2>Dispute Resolution</h2>
            <p>
                The European Commission provides a platform for online dispute resolution (OS):{' '}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                    https://ec.europa.eu/consumers/odr
                </a>
            </p>
            <p>
                We are not willing or obliged to participate in dispute resolution proceedings
                before a consumer arbitration board.
            </p>

            <hr className="my-8 border-white/10" />
            <p className="text-xs text-text-tertiary">
                This imprint satisfies German and EU requirements for B2B services.
                Consumer provisions do not apply as InPsyq exclusively serves business customers.
            </p>
        </PageShell>
    );
}
