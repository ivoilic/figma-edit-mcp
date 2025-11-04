import { ToolUsageInfo } from '../../types.js';

/**
 * Usage information for get_variables tool
 */
export const getVariablesMetadata: ToolUsageInfo = {
  name: "get_variables",
  description: "Retrieves all variables from a Figma file. Variables are reusable design tokens like colors, spacing, etc.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      }
    },
    required: ["fileId"]
  },
  examples: [
    {
      title: "Get All Variables",
      description: "Retrieve all variables from a Figma file",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>get_variables</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID"
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "Variables are design tokens that can be reused across your design.",
    "Variables can be of different types: COLOR, FLOAT, STRING, BOOLEAN.",
    "Use variables in node properties by referencing them with their variable ID.",
    "The response will include variable collections, modes, and variable definitions."
  ]
};
