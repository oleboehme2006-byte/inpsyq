import { Construct } from '../measurement/constructs';

export type EdgeType = 'contributes_to' | 'moderates' | 'amplifies' | 'inhibits' | 'requires';

export interface ConstructEdge {
    source: Construct;
    target: Construct;
    type: EdgeType;
    strength: number; // 0.0 to 1.0 (magnitude of effect)
    description: string; // Explanation of the causal link
}

export interface DownstreamEffect {
    construct: Construct;
    type: EdgeType;
    path_strength: number;
    depth: number;
}

export interface OntologyNode {
    construct: Construct;
    layer: 'first_order' | 'second_order' | 'outcome';
    node_type: 'latent' | 'behavioral' | 'structural'; // latent=internal state, behavioral=observable action, structural=environment
    outgoing: ConstructEdge[];
    incoming: ConstructEdge[];
}
