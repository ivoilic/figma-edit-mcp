import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { FigmaGetFileParams } from '../../types.js';
import { FIGMA_ACCESS_TOKEN } from '../../config/index.js';
import axios from 'axios';

/**
 * Handler for get_file tool
 * @param params Tool parameters
 * @returns Tool execution result
 */
export async function handleGetFileTool(params: FigmaGetFileParams) {
  try {
    const { fileId, includeComponents = false, includeStyles = false, includeNodes = [], depth } = params;
    
    if (!FIGMA_ACCESS_TOKEN) {
      const errorMessage = "FIGMA_ACCESS_TOKEN is not configured";
      console.error(errorMessage);
      return {
        content: [{
          type: "text",
          text: `Error: ${errorMessage}`
        }],
        isError: true
      };
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (includeComponents) {
      queryParams.append('components', 'true');
    }
    
    if (includeStyles) {
      queryParams.append('styles', 'true');
    }
    
    if (includeNodes && includeNodes.length > 0) {
      queryParams.append('ids', includeNodes.join(','));
    }
    
    if (depth !== undefined) {
      queryParams.append('depth', depth.toString());
    }
    
    // Call Figma API to get file contents
    const url = `https://api.figma.com/v1/files/${fileId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'X-Figma-Token': FIGMA_ACCESS_TOKEN
        }
      });
      
      const fileData = response.data;
      
      // Format and return file data
      return {
        content: [{
          type: "text",
          text: JSON.stringify(fileData, null, 2)
        }]
      };
    } catch (axiosError: any) {
      console.error(`Figma API error: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
      
      // Get detailed error response information
      const errorDetails = axiosError.response?.data?.error || axiosError.message || 'Unknown error';
      
      return {
        content: [{
          type: "text",
          text: `Error: Failed to fetch Figma file. Status: ${axiosError.response?.status || 'Unknown'} ${axiosError.response?.statusText || ''}\nDetails: ${errorDetails}`
        }],
        isError: true
      };
    }
  } catch (error) {
    console.error('Error processing get_file request:', error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}