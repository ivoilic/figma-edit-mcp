import { handleGetToolUsageTool } from './get-tool-usage/index.js';
import { handleGetFileTool } from './get-file/index.js';
import { handleCreateNodeTool } from './create-node/index.js';
import { handleUpdateNodeTool } from './update-node/index.js';
import { USAGE_TOOL_NAME, GET_FILE_TOOL_NAME, CREATE_NODE_TOOL_NAME, UPDATE_NODE_TOOL_NAME } from '../config/index.js';

// ツールハンドラーの型定義
type ToolHandler = (params: any) => Promise<{
  content: { type: string; text: string }[];
  isError?: boolean;
}>;

/**
 * Tool handler map
 */
export const toolHandlers: Record<string, ToolHandler> = {
  [USAGE_TOOL_NAME]: handleGetToolUsageTool,
  [GET_FILE_TOOL_NAME]: handleGetFileTool,
  [CREATE_NODE_TOOL_NAME]: handleCreateNodeTool,
  [UPDATE_NODE_TOOL_NAME]: handleUpdateNodeTool
};

/**
 * Get tool handler by tool name
 * @param toolName Tool name
 * @returns Tool handler
 */
export function getToolHandler(toolName: string): ToolHandler | undefined {
  return toolHandlers[toolName];
}

// Export tool registry
export * from './tool-registry.js';