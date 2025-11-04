import { ToolUsageInfo } from '../../types.js';

/**
 * Usage information for delete_variable tool
 */
export const deleteVariableMetadata: ToolUsageInfo = {
  name: "delete_variable",
  description: "Deletes a variable from a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      },
      variableId: {
        type: "string",
        description: "ID of the variable to delete"
      }
    },
    required: ["fileId", "variableId"]
  },
  examples: [
    {
      title: "Delete a Variable",
      description: "Delete an existing variable from a file",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>delete_variable</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "variableId": "VARIABLE_ID"
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "Variable IDs can be obtained from get_variables tool.",
    "Deleting a variable will remove it from all nodes that use it.",
    "This action cannot be undone."
  ]
};
