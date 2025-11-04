import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * Handler for update_node tool
 * Updates any property of an existing Figma node or deletes it
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleUpdateNodeTool(params: {
  fileId: string;
  nodeId: string;
  operation: 'update' | 'delete';
  properties?: Record<string, any>;
  parentId?: string;
  index?: number;
}) {
  try {
    const { fileId, nodeId, operation, properties, parentId, index } = params;
    
    if (!fileId) {
      return {
        content: [{
          type: "text",
          text: `Error: fileId is required`
        }],
        isError: true
      };
    }
    
    if (!nodeId) {
      return {
        content: [{
          type: "text",
          text: `Error: nodeId is required`
        }],
        isError: true
      };
    }
    
    if (!operation || !['update', 'delete'].includes(operation)) {
      return {
        content: [{
          type: "text",
          text: `Error: operation must be either 'update' or 'delete'`
        }],
        isError: true
      };
    }
    
    if (operation === 'update' && !properties) {
      return {
        content: [{
          type: "text",
          text: `Error: properties are required when operation is 'update'`
        }],
        isError: true
      };
    }
    
    // Create update message
    const update = {
      type: operation === 'delete' ? 'deleteNode' : 'updateNode',
      data: {
        nodeId,
        ...(operation === 'update' ? { properties } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        ...(index !== undefined ? { index } : {})
      }
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      const operationText = operation === 'delete' ? 'deletion' : 'update';
      return {
        content: [{
          type: "text",
          text: `Node ${operationText} request sent to Figma plugin for file ${fileId}`
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `Warning: Could not find connected plugin for file ${fileId}. Please open the file in Figma and run the plugin first.`
        }],
        isError: true
      };
    }
  } catch (error) {
    console.error('Error processing update_node request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
