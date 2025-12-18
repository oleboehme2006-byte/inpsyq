import { Construct } from '../measurement/constructs';
import { CAUSAL_EDGES, CONSTRUCT_LAYERS, CONSTRUCT_TYPES } from './graph';
import { ConstructEdge, DownstreamEffect, OntologyNode } from './types';

class OntologyService {
    private adjacencyList: Map<Construct, ConstructEdge[]> = new Map();

    constructor() {
        this.buildGraph();
    }

    private buildGraph() {
        CAUSAL_EDGES.forEach(edge => {
            if (!this.adjacencyList.has(edge.source)) {
                this.adjacencyList.set(edge.source, []);
            }
            this.adjacencyList.get(edge.source)!.push(edge);
        });
    }

    public getNode(c: Construct): OntologyNode {
        return {
            construct: c,
            layer: CONSTRUCT_LAYERS[c],
            node_type: CONSTRUCT_TYPES[c],
            outgoing: this.adjacencyList.get(c) || [],
            incoming: CAUSAL_EDGES.filter(e => e.target === c)
        };
    }

    public getDownstreamEffects(c: Construct, maxDepth = 2): DownstreamEffect[] {
        const effects: DownstreamEffect[] = [];
        const queue: { node: Construct, depth: number, strength: number }[] = [{ node: c, depth: 0, strength: 1.0 }];
        const visited = new Set<Construct>();

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.depth >= maxDepth) continue;

            const edges = this.adjacencyList.get(current.node) || [];
            for (const edge of edges) {
                if (visited.has(edge.target)) continue;

                const pathStrength = current.strength * edge.strength;
                effects.push({
                    construct: edge.target,
                    type: edge.type,
                    path_strength: pathStrength,
                    depth: current.depth + 1
                });

                visited.add(edge.target);
                queue.push({ node: edge.target, depth: current.depth + 1, strength: pathStrength });
            }
        }
        return effects;
    }

    public getRoots(): Construct[] {
        // First order constructs are effectively roots in this DAG
        return Object.entries(CONSTRUCT_LAYERS)
            .filter(([_, layer]) => layer === 'first_order')
            .map(([c]) => c as Construct);
    }
}

export const ontologyService = new OntologyService();
