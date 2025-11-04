import { ToolUsageInfo } from '../../types.js';
import { USAGE_TOOL_NAME, USAGE_TOOL_DESCRIPTION } from '../../config/index.js';

/**
 * Usage information for get_mcp_tool_usage tool
 */
export const getToolUsageMetadata: ToolUsageInfo = {
  name: USAGE_TOOL_NAME,
  description: USAGE_TOOL_DESCRIPTION,
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "Name of the tool for which to get usage information"
      }
    },
    required: ["toolName"]
  },
  examples: [
    {
      title: "Getting Usage Information for the create_node Tool",
      description: "Example of retrieving detailed usage information for the create_node tool",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>get_mcp_tool_usage</tool_name>
<arguments>
{
  "toolName": "create_node"
}
</arguments>
</use_mcp_tool>`
    }
  ]
};