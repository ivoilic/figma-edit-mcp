import { ToolUsageInfo } from '../../types.js';

/**
 * update_node ツールの使用方法情報
 */
export const updateNodeMetadata: ToolUsageInfo = {
  name: "update_node",
  description: "Updates any property of an existing Figma node or deletes it. This is a low-level tool that provides maximum flexibility for modifying nodes.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      },
      nodeId: {
        type: "string",
        description: "ID of the node to update or delete. Node IDs can be obtained from get_file tool or from the Figma file structure."
      },
      operation: {
        type: "string",
        enum: ["update", "delete"],
        description: "The operation to perform: 'update' to modify properties, 'delete' to remove the node"
      },
      properties: {
        type: "object",
        description: "Properties to update on the node. Can include any valid Figma node property. Only used when operation is 'update'. You can update properties like name, x, y, width, height, fills, strokes, effects, opacity, visible, etc.",
        additionalProperties: true
      },
      parentId: {
        type: "string",
        description: "Optional: When updating, move the node to a different parent by specifying the new parent ID. When deleting, this is not used."
      },
      index: {
        type: "number",
        description: "Optional: When updating and moving to a new parent, specify the index position within the parent's children array."
      }
    },
    required: ["fileId", "nodeId", "operation"]
  },
  examples: [
    {
      title: "Update Node Properties",
      description: "Update multiple properties of an existing node",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeId": "NODE_ID",
  "operation": "update",
  "properties": {
    "x": 200,
    "y": 200,
    "opacity": 0.8,
    "visible": true,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 1.0, "g": 0.0, "b": 0.0 }
      }
    ]
  }
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Update Text Content",
      description: "Update the text content and styling of a text node",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeId": "TEXT_NODE_ID",
  "operation": "update",
  "properties": {
    "characters": "New Text Content",
    "fontSize": 32,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.0, "g": 0.0, "b": 1.0 }
      }
    ]
  }
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Move Node to Different Parent",
      description: "Move a node to a different parent container",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeId": "NODE_ID",
  "operation": "update",
  "parentId": "NEW_PARENT_ID",
  "index": 0
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Delete a Node",
      description: "Delete an existing node from the file",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_node</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "nodeId": "NODE_ID",
  "operation": "delete"
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "This tool provides low-level access to update any property of existing Figma nodes.",
    "Node IDs can be obtained from the get_file tool or by inspecting the Figma file structure.",
    "When updating properties, you can set any valid Figma node property. Properties not specified will remain unchanged.",
    "To move a node to a different parent, specify both parentId and optionally index for the position.",
    "Deleting a node will also delete all its children.",
    "Color values in fills and strokes use RGB values from 0 to 1.",
    "Refer to Figma Plugin API documentation for complete list of available properties for each node type."
  ]
};
