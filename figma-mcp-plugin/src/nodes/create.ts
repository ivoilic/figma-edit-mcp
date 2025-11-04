import { findNodeById } from "../utils/node-utils";
import { applyPropertiesToNode } from "../utils/node-utils";

// Low-level: Create any node type
export const createNode = async (data: {
  nodeType: string;
  properties: Record<string, unknown>;
  parentId?: string;
}) => {
  const { nodeType, properties, parentId } = data;

  let node: SceneNode;

  // Create based on node type
  switch (nodeType.toUpperCase()) {
    case "FRAME":
      node = figma.createFrame();
      break;
    case "TEXT":
      node = figma.createText();
      // For text nodes, characters must be set
      if (properties.characters !== undefined) {
        // Font must be loaded
        const fontName = properties.fontName as
          | { family?: string; style?: string }
          | undefined;
        const fontWeight = properties.fontWeight as string | undefined;
        const fontFamily = fontName?.family || "Inter";
        const fontStyle = fontName?.style || fontWeight || "Regular";
        try {
          await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
          (node as TextNode).characters = properties.characters as string;
        } catch (e) {
          console.error("Error loading font:", e);
          // Try default font
          try {
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            (node as TextNode).characters = properties.characters as string;
          } catch (e2) {
            console.error("Error loading default font:", e2);
            throw new Error(`Failed to load font: ${fontFamily} ${fontStyle}`);
          }
        }
      }
      break;
    case "RECTANGLE":
      node = figma.createRectangle();
      break;
    case "ELLIPSE":
      node = figma.createEllipse();
      break;
    case "LINE":
      node = figma.createLine();
      break;
    case "VECTOR":
      node = figma.createVector();
      break;
    case "STAR":
      node = figma.createStar();
      break;
    case "POLYGON":
      node = figma.createPolygon();
      break;
    case "GROUP":
      // Groups are created by selecting nodes and calling createGroup
      // For now, create a frame and we'll handle it as a group
      node = figma.createFrame();
      break;
    case "COMPONENT":
      node = figma.createComponent();
      break;
    case "COMPONENT_SET":
      // Component sets are not directly creatable in the plugin API
      // Create a component instead
      node = figma.createComponent();
      break;
    case "SECTION":
      node = figma.createSection();
      break;
    default:
      throw new Error(`Unsupported node type: ${nodeType}`);
  }

  // Apply properties
  applyPropertiesToNode(node, properties);

  // Set parent node
  let parent: ChildrenMixin = figma.currentPage;
  if (parentId) {
    const foundParent = findNodeById(parentId);
    if (foundParent && "appendChild" in foundParent) {
      parent = foundParent as ChildrenMixin;
    }
  }

  if (parent !== node.parent) {
    parent.appendChild(node);
  }

  // Move viewport to new node
  figma.viewport.scrollAndZoomIntoView([node]);
};
