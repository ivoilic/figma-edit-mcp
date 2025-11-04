import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * Handler for delete_variable tool
 * Deletes a variable from a Figma file
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleDeleteVariableTool(params: {
  fileId: string;
  variableId: string;
}) {
  try {
    const { fileId, variableId } = params;
    
    if (!fileId) {
      return {
        content: [{
          type: "text",
          text: `Error: fileId is required`
        }],
        isError: true
      };
    }
    
    if (!variableId) {
      return {
        content: [{
          type: "text",
          text: `Error: variableId is required`
        }],
        isError: true
      };
    }
    
    // Create update message
    const update = {
      type: 'deleteVariable',
      data: {
        variableId
      }
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      return {
        content: [{
          type: "text",
          text: `Variable deletion request sent to Figma plugin for file ${fileId}`
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
    console.error('Error processing delete_variable request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
