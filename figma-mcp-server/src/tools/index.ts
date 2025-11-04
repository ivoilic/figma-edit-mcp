import { handleUpdateFileTool } from './update-file/index.js';
import { handleGetToolUsageTool } from './get-tool-usage/index.js';
import { handleGetFileTool } from './get-file/index.js';
import { handleCreateNodeTool } from './create-node/index.js';
import { handleUpdateNodeTool } from './update-node/index.js';
import { UPDATE_FILE_TOOL_NAME, USAGE_TOOL_NAME, GET_FILE_TOOL_NAME, CREATE_NODE_TOOL_NAME, UPDATE_NODE_TOOL_NAME } from '../config/index.js';

// ツールハンドラーの型定義
type ToolHandler = (params: any) => Promise<{
  content: { type: string; text: string }[];
  isError?: boolean;
}>;

/**
 * ツールハンドラーのマップ
 */
export const toolHandlers: Record<string, ToolHandler> = {
  [UPDATE_FILE_TOOL_NAME]: handleUpdateFileTool,
  [USAGE_TOOL_NAME]: handleGetToolUsageTool,
  [GET_FILE_TOOL_NAME]: handleGetFileTool,
  [CREATE_NODE_TOOL_NAME]: handleCreateNodeTool,
  [UPDATE_NODE_TOOL_NAME]: handleUpdateNodeTool
};

/**
 * ツール名からハンドラーを取得する
 * @param toolName ツール名
 * @returns ツールハンドラー
 */
export function getToolHandler(toolName: string): ToolHandler | undefined {
  return toolHandlers[toolName];
}

// ツールレジストリをエクスポート
export * from './tool-registry.js';