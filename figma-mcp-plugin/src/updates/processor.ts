import { logToUI } from '../utils/logger';
import { createFrameElement } from '../elements/frame';
import { createTextElement } from '../elements/text';
import { createRectangleElement } from '../elements/rectangle';
import { createEllipseElement } from '../elements/ellipse';
import { createLineElement } from '../elements/line';
import { createImageElement } from '../elements/image';
import { createComponentElement } from '../elements/component';
import { createNode } from '../nodes/create';
import { updateNode } from '../nodes/update';
import { deleteNode } from '../nodes/delete';

type UpdateData = {
  type: string;
  data: Record<string, unknown>;
};

// Apply updates to Figma design
export const applyUpdates = async (updates: unknown) => {
  try {
    // Process updates
    if (
      updates &&
      typeof updates === 'object' &&
      'updates' in updates &&
      Array.isArray((updates as { updates: unknown[] }).updates)
    ) {
      // Format from MCP server (updates.updates format)
      const updateList = (updates as { updates: UpdateData[] }).updates;
      
      // Process each update
      for (const update of updateList) {
        const { type, data } = update;
        if (!type) continue;

        // Log tool call
        if (type === 'createNode') {
          logToUI(`create_node called`);
        } else if (type === 'updateNode') {
          logToUI(`update_node called`);
        } else if (type === 'deleteNode') {
          logToUI(`delete_node called`);
        }

        // Process new low-level operations
        if (type === 'createNode') {
          await createNode(data as Parameters<typeof createNode>[0]);
        } else if (type === 'updateNode') {
          await updateNode(data as Parameters<typeof updateNode>[0]);
        } else if (type === 'deleteNode') {
          deleteNode(data as Parameters<typeof deleteNode>[0]);
        } else {
          // Legacy format updates (for compatibility)
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else if (Array.isArray(updates)) {
      // Array format (for compatibility)
      // Process each update
      for (const update of updates as UpdateData[]) {
        const { type, data } = update;
        if (!type) continue;

        // Log tool call
        if (type === 'createNode') {
          logToUI(`create_node called`);
        } else if (type === 'updateNode') {
          logToUI(`update_node called`);
        } else if (type === 'deleteNode') {
          logToUI(`delete_node called`);
        }

        // Process new low-level operations
        if (type === 'createNode') {
          await createNode(data as Parameters<typeof createNode>[0]);
        } else if (type === 'updateNode') {
          await updateNode(data as Parameters<typeof updateNode>[0]);
        } else if (type === 'deleteNode') {
          deleteNode(data as Parameters<typeof deleteNode>[0]);
        } else {
          // Legacy format updates (for compatibility)
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else {
      // 旧形式の更新（互換性のため）
      await processUpdates(updates as Record<string, unknown>);
    }

    figma.notify('Design updated successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Failed to apply updates: ${errorMessage}`, 'error');
    figma.notify('Error occurred while updating design', { error: true });
  }
};

// Function to process updates
const processUpdates = async (updates: Record<string, unknown>) => {
  // Create frame
  if (updates.createFrame) {
    createFrameElement(
      updates.createFrame as Parameters<typeof createFrameElement>[0]
    );
  }

  // Create text elements
  if (updates.createText) {
    if (Array.isArray(updates.createText)) {
      // Process each element if array
      await Promise.all(
        (updates.createText as unknown[]).map(
          (textData: unknown, index: number) =>
            createTextElement(
              textData as Parameters<typeof createTextElement>[0],
              index
            )
        )
      );
    } else {
      // Single object case
      await createTextElement(
        updates.createText as Parameters<typeof createTextElement>[0]
      );
    }
  }

  // Create rectangles
  if (updates.createRectangle) {
    if (Array.isArray(updates.createRectangle)) {
      // Process each element if array
      await Promise.all(
        (updates.createRectangle as unknown[]).map(
          (rectData: unknown, index: number) =>
            createRectangleElement(
              rectData as Parameters<typeof createRectangleElement>[0],
              index
            )
        )
      );
    } else {
      // Single object case
      await createRectangleElement(
        updates.createRectangle as Parameters<typeof createRectangleElement>[0]
      );
    }
  }

  // Create ellipses
  if (updates.createEllipse) {
    if (Array.isArray(updates.createEllipse)) {
      // Process each element if array
      await Promise.all(
        (updates.createEllipse as unknown[]).map(
          (ellipseData: unknown, index: number) =>
            createEllipseElement(
              ellipseData as Parameters<typeof createEllipseElement>[0],
              index
            )
        )
      );
    } else {
      // Single object case
      await createEllipseElement(
        updates.createEllipse as Parameters<typeof createEllipseElement>[0]
      );
    }
  }

  // Create lines
  if (updates.createLine) {
    if (Array.isArray(updates.createLine)) {
      // Process each element if array
      (updates.createLine as unknown[]).forEach(
        (lineData: unknown, index: number) => {
          createLineElement(
            lineData as Parameters<typeof createLineElement>[0],
            index
          );
        }
      );
    } else {
      // Single object case
      createLineElement(
        updates.createLine as Parameters<typeof createLineElement>[0]
      );
    }
  }

  // Insert images
  if (updates.createImage) {
    if (Array.isArray(updates.createImage)) {
      // Process each element if array
      (updates.createImage as unknown[]).forEach(
        (imageData: unknown, index: number) => {
          createImageElement(
            imageData as Parameters<typeof createImageElement>[0],
            index
          );
        }
      );
    } else {
      // Single object case
      createImageElement(
        updates.createImage as Parameters<typeof createImageElement>[0]
      );
    }
  }

  // Create components
  if (updates.createComponent) {
    if (Array.isArray(updates.createComponent)) {
      // Process each element if array
      (updates.createComponent as unknown[]).forEach(
        (componentData: unknown, index: number) => {
          createComponentElement(
            componentData as Parameters<typeof createComponentElement>[0],
            index
          );
        }
      );
    } else {
      // Single object case
      createComponentElement(
        updates.createComponent as Parameters<typeof createComponentElement>[0]
      );
    }
  }
};

