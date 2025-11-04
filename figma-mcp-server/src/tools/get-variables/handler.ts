import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * Handler for get_variables tool
 * Retrieves variables from a Figma file
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleGetVariablesTool(params: {
  fileId: string;
}) {
  try {
    const { fileId } = params;
    
    if (!fileId) {
      return {
        content: [{
          type: "text",
          text: `Error: fileId is required`
        }],
        isError: true
      };
    }
    
    // Create request message
    const update = {
      type: 'getVariables',
      data: {}
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      return {
        content: [{
          type: "text",
          text: `Variables retrieval request sent to Figma plugin for file ${fileId}. Use get_file tool or check plugin response to get the variables.`
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
    console.error('Error processing get_variables request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
