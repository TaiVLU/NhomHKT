import { assembleKnowledgeGraph, createKnowledgeGraphAssembler } from './knowledge-graph-assembler';
import type { SEOResult } from '../core/result';
import type { StructuredDataGraph, StructuredDataNodeInput } from './types';

export const buildStructuredDataGraph = (
  nodes: readonly StructuredDataNodeInput[],
): SEOResult<StructuredDataGraph> => assembleKnowledgeGraph(nodes);

export interface StructuredDataGraphBuilder {
  append(node: StructuredDataNodeInput): StructuredDataGraphBuilder;
  appendMany(nodes: readonly StructuredDataNodeInput[]): StructuredDataGraphBuilder;
  freeze(): SEOResult<StructuredDataGraph>;
}

export const createStructuredDataGraphBuilder = (): StructuredDataGraphBuilder => {
  const assembler = createKnowledgeGraphAssembler();

  return {
    append(node) {
      assembler.append(node);
      return this;
    },
    appendMany(nextNodes) {
      assembler.appendMany(nextNodes);
      return this;
    },
    freeze() {
      return assembler.freeze();
    },
  };
};
