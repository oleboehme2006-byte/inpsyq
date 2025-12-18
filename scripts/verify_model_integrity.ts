
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { ontologyService } from '@/services/ontology';
import { CONSTRUCTS } from '@/services/measurement/constructs';

async function verify() {
    console.log('--- Verifying Model Integrity: Ontology ---');

    // 1. Check Graph Validity
    console.log('1. Checking Graph Structure...');
    let edgeCount = 0;
    const roots = ontologyService.getRoots();
    console.log(`✅ Identified ${roots.length} Root Constructs (First Order): ${roots.join(', ')}`);

    for (const c of CONSTRUCTS) {
        const node = ontologyService.getNode(c);
        edgeCount += node.outgoing.length;
        if (node.layer === 'outcome' && node.outgoing.length > 0) {
            console.warn(`⚠️ Outcome node '${c}' has outgoing edges. Is the DAG valid?`);
        }
    }
    console.log(`✅ Total Causal Edges defined: ${edgeCount}`);

    // 2. Check Downstream Effects
    console.log('\n2. Testing Traversal (Autonomy -> ?)...');
    const effects = ontologyService.getDownstreamEffects('autonomy');
    console.log('Downstream of Autonomy:', effects.map(e => `${e.type}->${e.construct} (${e.path_strength.toFixed(2)})`));

    if (effects.find(e => e.construct === 'engagement')) {
        console.log('✅ Autonomy correctly links to Engagement (Depth > 1)');
    } else {
        console.error('❌ Autonomy -> Engagement link missing!');
        process.exit(1);
    }

    // 3. Cycle Detection (Simple Depth checks)
    console.log('\n3. Cycle Safety Check...');
    // If getDownstreamEffects doesn't crash with infinite loop, we are good (it has visited set).
    // But let's check self-reference.
    if (effects.some(e => e.construct === 'autonomy')) {
        console.error('❌ Cycle detected: Autonomy leads back to Autonomy!');
        process.exit(1);
    }
    console.log('✅ No immediate cycles detected.');

    console.log('\n--- ONTOLOGY VERIFIED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
