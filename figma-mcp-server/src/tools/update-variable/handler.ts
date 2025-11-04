import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * Handler for update_variable tool
 * Updates an existing variable in a Figma file
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleUpdateVariableTool(params: {
  fileId: string;
  variableId: string;
  name?: string;
  valuesByMode?: Record<string, any>;
  description?: string;
  scopes?: Array<'ALL_SCOPES' | 'TEXT_COLOR' | 'BG_COLOR' | 'FILL_COLOR' | 'STROKE_COLOR' | 'EFFECT_COLOR' | 'OPACITY' | 'FONT_FAMILY' | 'FONT_SIZE' | 'FONT_WEIGHT' | 'LINE_HEIGHT' | 'LETTER_SPACING' | 'PARAGRAPH_SPACING' | 'PARAGRAPH_INDENT' | 'BORDER_RADIUS' | 'SPACING' | 'DIMENSION' | 'GAP' | 'SIZING_WIDTH' | 'SIZING_HEIGHT'>;
}) {
  try {
    const { fileId, variableId, name, valuesByMode, description, scopes } = params;
    
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
      type: 'updateVariable',
      data: {
        variableId,
        name,
        valuesByMode,
        description,
        scopes
      }
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      return {
        content: [{
          type: "text",
          text: `Variable update request sent to Figma plugin for file ${fileId}`
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
    console.error('Error processing update_variable request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
