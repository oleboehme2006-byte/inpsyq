/**
 * DEBUG INTERPRETATION SERVICE
 * 
 * Invokes the service function directly to expose stack traces.
 */

import './_bootstrap';
import { getOrCreateOrgInterpretation } from '../services/interpretation/service';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

async function main() {
    console.log('--- DEBUGGING INTERPRETATION SERVICE ---');
    try {
        console.log(`Calling getOrCreateOrgInterpretation for ${ORG_ID}...`);
        const result = await getOrCreateOrgInterpretation(ORG_ID);
        console.log('SUCCESS:', result);
    } catch (e: any) {
        console.error('--- ERROR CAUGHT ---');
        console.error(e);
        console.error('Stack:', e.stack);
    }
}

main().catch(console.error);
