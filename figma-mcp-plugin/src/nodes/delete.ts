import { findNodeById } from '../utils/node-utils';

// Low-level: Delete node
export const deleteNode = (data: { nodeId: string }) => {
  const { nodeId } = data;

  const node = findNodeById(nodeId);
  if (!node) {
    throw new Error(`Node with id ${nodeId} not found`);
  }

  node.remove();
};

