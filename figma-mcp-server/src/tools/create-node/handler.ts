import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { addToMessageQueue } from '../../api/message-queue.js';

/**
 * create_node ツールのハンドラー
 * Creates any Figma node type with any properties
 * @param params ツールパラメータ
 * @returns ツールの実行結果
 */
export async function handleCreateNodeTool(params: {
  fileId: string;
  nodeType: string;
  properties: Record<string, any>;
  parentId?: string;
}) {
  try {
    const { fileId, nodeType, properties, parentId } = params;
    
    if (!fileId) {
      return {
        content: [{
          type: "text",
          text: `Error: fileId is required`
        }],
        isError: true
      };
    }
    
    if (!nodeType) {
      return {
        content: [{
          type: "text",
          text: `Error: nodeType is required`
        }],
        isError: true
      };
    }
    
    // Validate node type
    const validNodeTypes = [
      'FRAME', 'TEXT', 'RECTANGLE', 'ELLIPSE', 'LINE', 'VECTOR', 
      'STAR', 'POLYGON', 'GROUP', 'COMPONENT', 'COMPONENT_SET', 
      'INSTANCE', 'BOOLEAN_OPERATION', 'SLICE', 'STICKY', 
      'CONNECTOR', 'SHAPE_WITH_TEXT', 'CODE_BLOCK', 'EMBED', 
      'LINK_UNFURL', 'MEDIA', 'SECTION', 'HIGHLIGHT', 'WIDGET'
    ];
    
    if (!validNodeTypes.includes(nodeType.toUpperCase())) {
      return {
        content: [{
          type: "text",
          text: `Error: Invalid nodeType "${nodeType}". Valid types: ${validNodeTypes.join(', ')}`
        }],
        isError: true
      };
    }
    
    // Create update message
    const update = {
      type: 'createNode',
      data: {
        nodeType: nodeType.toUpperCase(),
        properties,
        parentId
      }
    };
    
    // Add to message queue
    const success = addToMessageQueue(fileId, { updates: [update] });
    
    if (success) {
      return {
        content: [{
          type: "text",
          text: `Node creation request sent to Figma plugin for file ${fileId}`
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
    console.error('Error processing create_node request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
