import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * Handler for create_variable tool
 * Creates a new variable in a Figma file
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleCreateVariableTool(params: {
  fileId: string;
  name: string;
  variableType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, any>;
  collectionId?: string;
  description?: string;
  scopes?: Array<'ALL_SCOPES' | 'TEXT_COLOR' | 'BG_COLOR' | 'FILL_COLOR' | 'STROKE_COLOR' | 'EFFECT_COLOR' | 'OPACITY' | 'FONT_FAMILY' | 'FONT_SIZE' | 'FONT_WEIGHT' | 'LINE_HEIGHT' | 'LETTER_SPACING' | 'PARAGRAPH_SPACING' | 'PARAGRAPH_INDENT' | 'BORDER_RADIUS' | 'SPACING' | 'DIMENSION' | 'GAP' | 'SIZING_WIDTH' | 'SIZING_HEIGHT'>;
}) {
  try {
    const { fileId, name, variableType, valuesByMode, collectionId, description, scopes } = params;
    
    if (!fileId) {
      return {
        content: [{
          type: "text",
          text: `Error: fileId is required`
        }],
        isError: true
      };
    }
    
    if (!name) {
      return {
        content: [{
          type: "text",
          text: `Error: name is required`
        }],
        isError: true
      };
    }
    
    if (!variableType) {
      return {
        content: [{
          type: "text",
          text: `Error: variableType is required`
        }],
        isError: true
      };
    }
    
    if (!valuesByMode || Object.keys(valuesByMode).length === 0) {
      return {
        content: [{
          type: "text",
          text: `Error: valuesByMode is required and must have at least one mode`
        }],
        isError: true
      };
    }
    
    // Create update message
    const update = {
      type: 'createVariable',
      data: {
        name,
        variableType,
        valuesByMode,
        collectionId,
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
          text: `Variable creation request sent to Figma plugin for file ${fileId}`
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
    console.error('Error processing create_variable request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
