import { findNodeById } from '../utils/node-utils';
import { applyPropertiesToNode } from '../utils/node-utils';
import { logToUI } from '../utils/logger';

// Low-level: Update node properties
export const updateNode = async (data: {
  nodeId: string;
  properties?: Record<string, unknown>;
  parentId?: string;
  index?: number;
}) => {
  const { nodeId, properties, parentId, index } = data;

  const node = findNodeById(nodeId);
  if (!node) {
    const error = `Node with id ${nodeId} not found`;
    logToUI(error, 'error');
    throw new Error(error);
  }

  // Change parent node if needed
  if (parentId !== undefined) {
    const newParent = findNodeById(parentId);
    if (newParent && 'appendChild' in newParent) {
      const parent = newParent as ChildrenMixin;
      if (index !== undefined) {
        parent.insertChild(index, node);
      } else {
        parent.appendChild(node);
      }
    }
  }

  // Update properties
  if (properties) {
    applyPropertiesToNode(node, properties);
  }
};

