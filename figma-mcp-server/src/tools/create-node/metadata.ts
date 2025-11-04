import { ToolUsageInfo } from '../../types.js';

/**
 * Usage information for create_node tool
 */
export const createNodeMetadata: ToolUsageInfo = {
  name: "create_node",
  description: "Creates any Figma node type with any properties. This is a low-level tool that provides maximum flexibility for creating nodes.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      },
      nodeType: {
        type: "string",
        enum: [
          'FRAME', 'TEXT', 'RECTANGLE', 'ELLIPSE', 'LINE', 'VECTOR', 
          'STAR', 'POLYGON', 'GROUP', 'COMPONENT', 'COMPONENT_SET', 
          'INSTANCE', 'BOOLEAN_OPERATION', 'SLICE', 'STICKY', 
          'CONNECTOR', 'SHAPE_WITH_TEXT', 'CODE_BLOCK', 'EMBED', 
          'LINK_UNFURL', 'MEDIA', 'SECTION', 'HIGHLIGHT', 'WIDGET'
        ],
        description: "The type of node to create. Must be one of the supported Figma node types."
      },
      properties: {
        type: "object",
        description: "Properties to set on the node. Can include any valid Figma node property such as name, x, y, width, height, fills, strokes, effects, etc. See Figma Plugin API documentation for full property list.",
        additionalProperties: true
      },
      parentId: {
        type: "string",
        description: "Optional: ID of the parent node to append this node to. If not provided, node will be added to the current page."
      }
    },
    required: ["fileId", "nodeType", "properties"]
  },
  examples: [
    {
      title: "Create a Frame",
      description: "Create a frame with basic properties",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>create_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeType": "FRAME",
  "properties": {
    "name": "My Frame",
    "x": 100,
    "y": 100,
    "width": 400,
    "height": 300,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.9, "g": 0.9, "b": 0.9 }
      }
    ],
    "cornerRadius": 8
  }
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Create Text Node",
      description: "Create a text node with formatting",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>create_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeType": "TEXT",
  "properties": {
    "name": "Heading",
    "characters": "Hello World",
    "x": 100,
    "y": 100,
    "fontSize": 24,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.1, "g": 0.1, "b": 0.1 }
      }
    ]
  }
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Create Rectangle with Advanced Properties",
      description: "Create a rectangle with fills, strokes, effects, and constraints",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>create_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeType": "RECTANGLE",
  "properties": {
    "name": "Button",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 50,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.2, "g": 0.6, "b": 1.0 }
      }
    ],
    "strokes": [
      {
        "type": "SOLID",
        "color": { "r": 0, "g": 0, "b": 0 }
      }
    ],
    "strokeWeight": 2,
    "cornerRadius": 8,
    "effects": [
      {
        "type": "DROP_SHADOW",
        "color": { "r": 0, "g": 0, "b": 0, "a": 0.2 },
        "offset": { "x": 0, "y": 4 },
        "radius": 8
      }
    ],
    "opacity": 1.0,
    "blendMode": "NORMAL"
  }
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "This tool provides low-level access to create any Figma node type with any property.",
    "All properties are passed directly to Figma's API, so you must use the exact property names and types from the Figma Plugin API.",
    "For text nodes, you must include the 'characters' property with the text content.",
    "Color values in fills and strokes use RGB values from 0 to 1.",
    "Refer to Figma Plugin API documentation for complete list of available properties for each node type.",
    "If parentId is provided, the node will be added as a child of that node. Otherwise, it will be added to the current page."
  ]
};
