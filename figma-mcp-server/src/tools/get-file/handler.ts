import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { FigmaGetFileParams } from '../../types.js';
import { FIGMA_ACCESS_TOKEN } from '../../config/index.js';

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
      const response = await fetch(url, {
        headers: {
          'X-Figma-Token': FIGMA_ACCESS_TOKEN
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorDetails = 'Unknown error';
        
        try {
          const errorData = JSON.parse(errorText);
          errorDetails = errorData.error || errorText;
        } catch {
          errorDetails = errorText || response.statusText;
        }
        
        console.error(`Figma API error: ${response.status} ${response.statusText}`);
        
        return {
          content: [{
            type: "text",
            text: `Error: Failed to fetch Figma file. Status: ${response.status} ${response.statusText}\nDetails: ${errorDetails}`
          }],
          isError: true
        };
      }
      
      const fileData = await response.json();
      
      // Format and return file data
      return {
        content: [{
          type: "text",
          text: JSON.stringify(fileData, null, 2)
        }]
      };
    } catch (fetchError) {
      console.error(`Figma API error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      return {
        content: [{
          type: "text",
          text: `Error: Failed to fetch Figma file.\nDetails: ${errorMessage}`
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