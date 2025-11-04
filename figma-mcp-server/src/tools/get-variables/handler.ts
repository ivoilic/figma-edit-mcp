import { addToMessageQueue, getCachedVariables, hasCache, getCachedFileIds } from '../../api/message-queue.js';

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
    
    // Check cache first
    const cached = getCachedVariables(fileId);
    if (cached && cached.variables.length > 0) {
      console.error(`[get_variables] Returning cached data for ${fileId}: ${cached.variables.length} variables`);
      const response = {
        variables: cached.variables,
        collections: cached.collections,
        _meta: {
          totalVariables: cached.variables.length,
          totalCollections: cached.collections.length,
          variableIds: cached.variables.map((v: any) => v.id),
          format: "Each variable has an 'id' field in 'VariableID:27:17' format for binding"
        }
      };
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response, null, 2)
        }]
      };
    }
    
    console.error(`[get_variables] No cache found for ${fileId}, requesting from plugin`);
    console.error(`[get_variables] All cached fileIds: ${getCachedFileIds().join(', ')}`);
    console.error(`[get_variables] Has cache entry for ${fileId}: ${hasCache(fileId)}`);
    
    // Create request message
    const update = {
      type: 'getVariables',
      data: {}
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      console.error(`[get_variables] Request sent to plugin for ${fileId}, waiting for response...`);
      // Wait for response (up to 5 seconds, checking every 100ms)
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const cached = getCachedVariables(fileId);
        if (cached && cached.variables.length > 0) {
          console.error(`[get_variables] Received variables after ${(i + 1) * 100}ms: ${cached.variables.length} variables`);
          const response = {
            variables: cached.variables,
            collections: cached.collections,
            _meta: {
              totalVariables: cached.variables.length,
              totalCollections: cached.collections.length,
              variableIds: cached.variables.map((v: any) => v.id),
              format: "Each variable has an 'id' field in 'VariableID:27:17' format for binding"
            }
          };
          return {
            content: [{
              type: "text",
              text: JSON.stringify(response, null, 2)
            }]
          };
        }
        if (i % 10 === 0) {
          console.error(`[get_variables] Still waiting... (${i + 1}/50)`);
        }
      }
      
      console.error(`[get_variables] Timeout waiting for variables from plugin for ${fileId}`);
      
      // If no response after waiting, return instructions
      return {
        content: [{
          type: "text",
          text: `Variables retrieval request sent to Figma plugin for file ${fileId}. No response received after 5 seconds. Please ensure the plugin is running and try again. The plugin should retrieve variables and send them back via WebSocket.`
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
