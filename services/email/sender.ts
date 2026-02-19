import { getEmailTransport } from './transport';
import { WeeklyDigest } from './templates/WeeklyDigest';
import { render } from '@react-email/components';

interface WeeklyDigestData {
    teamName: string;
    weekLabel: string;
    strain: number;
    engagement: number;
    topDriver?: {
        label: string;
        trend: 'improving' | 'worsening' | 'stable';
    };
    topAction?: {
        title: string;
        message: string;
    };
    dashboardUrl: string;
}

/**
 * Send the Weekly Digest email to a recipient.
 */
export async function sendWeeklyDigest(
    to: string,
    data: WeeklyDigestData
): Promise<boolean> {
    try {
        // Render the email template to HTML
        const html = await render(WeeklyDigest(data));

        const transport = getEmailTransport();
        const result = await transport.send({
            to,
            subject: `Weekly Update: ${data.teamName} (${data.weekLabel})`,
            html,
            text: `Weekly Intelligence Update for ${data.teamName}. Strain: ${data.strain}%, Engagement: ${data.engagement}%. View full analysis at ${data.dashboardUrl}`,
        });

        if (!result.ok) {
            console.error(`[EMAIL] Failed to send digest to ${to}: ${result.error || 'Unknown error'}`);
        } else {
            console.log(`[EMAIL] Digest sent to ${to} (ID: ${result.id})`);
        }

        return result.ok;
    } catch (error: any) {
        console.error('[EMAIL] Failed to render/send digest:', error.message);
        return false;
    }
}
