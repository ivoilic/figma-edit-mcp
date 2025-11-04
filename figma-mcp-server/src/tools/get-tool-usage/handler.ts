import { GetMcpToolUsageParams } from '../../types.js';
import { getToolUsageInfo } from '../tool-registry.js';
import { formatToolUsageInfo } from './format-usage.js';

/**
 * Handler for get_mcp_tool_usage tool
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleGetToolUsageTool(params: GetMcpToolUsageParams) {
  try {
    const { toolName } = params;
    
    // Get tool usage information
    const toolUsageInfo = getToolUsageInfo(toolName);
    
    if (!toolUsageInfo) {
      return {
        content: [{
          type: "text",
          text: `Error: Tool "${toolName}" not found or usage information not available.`
        }],
        isError: true
      };
    }
    
    // Format and return usage information
    const formattedUsage = formatToolUsageInfo(toolUsageInfo);
    
    return {
      content: [{
        type: "text",
        text: formattedUsage
      }]
    };
  } catch (error) {
    console.error('Error processing get_mcp_tool_usage request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}