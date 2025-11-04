import { ToolUsageInfo } from '../types.js';
import { getToolUsageMetadata } from './get-tool-usage/metadata.js';
import { getFileMetadata } from './get-file/metadata.js';
import { createNodeMetadata } from './create-node/metadata.js';
import { updateNodeMetadata } from './update-node/metadata.js';
import { getVariablesMetadata } from './get-variables/metadata.js';
import { createVariableMetadata } from './create-variable/metadata.js';
import { updateVariableMetadata } from './update-variable/metadata.js';
import { deleteVariableMetadata } from './delete-variable/metadata.js';

/**
 * Define usage information for available tools
 */
export const toolUsageRegistry: Record<string, ToolUsageInfo> = {
  // get_file tool usage
  "get_file": getFileMetadata,
  
  // get_mcp_tool_usage tool usage
  "get_mcp_tool_usage": getToolUsageMetadata,
  
  // create_node tool usage
  "create_node": createNodeMetadata,
  
  // update_node tool usage
  "update_node": updateNodeMetadata,
  
  // get_variables tool usage
  "get_variables": getVariablesMetadata,
  
  // create_variable tool usage
  "create_variable": createVariableMetadata,
  
  // update_variable tool usage
  "update_variable": updateVariableMetadata,
  
  // delete_variable tool usage
  "delete_variable": deleteVariableMetadata
};

/**
 * Get tool usage information by tool name
 * @param toolName Tool name
 * @returns Tool usage information
 */
export function getToolUsageInfo(toolName: string): ToolUsageInfo | null {
  return toolUsageRegistry[toolName] || null;
}