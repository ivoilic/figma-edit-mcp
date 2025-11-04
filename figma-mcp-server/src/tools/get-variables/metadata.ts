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
    "The response is a JSON object with 'variables' and 'collections' arrays.",
    "Each variable has an 'id' field in 'VariableID:27:17' format - USE THIS FOR BINDING.",
    "Use the 'id' field (VariableID format) when binding variables to nodes using boundVariables.",
    "Example binding format: { 'boundVariables': { 'fills': [{ 'type': 'VARIABLE_ALIAS', 'id': 'VariableID:27:17' }] } }",
    "The response also includes a '_meta' field with summary information and all variable IDs."
  ]
};
