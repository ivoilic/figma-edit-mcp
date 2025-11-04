// Function to create rectangle element
export function createRectangleElement(
  rectData: {
    name?: string;
    width?: number;
    height?: number;
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    strokeAlign?: "INSIDE" | "OUTSIDE" | "CENTER";
    cornerRadius?: number;
    topLeftRadius?: number;
    topRightRadius?: number;
    bottomLeftRadius?: number;
    bottomRightRadius?: number;
    x?: number;
    y?: number;
    opacity?: number;
    effects?: Effect[];
    visible?: boolean;
  },
  index?: number
) {
  return new Promise<SceneNode>(async (resolve, reject) => {
    try {
      const {
        name,
        width,
        height,
        fills,
        strokes,
        strokeWeight,
        strokeAlign,
        cornerRadius,
        topLeftRadius,
        topRightRadius,
        bottomLeftRadius,
        bottomRightRadius,
        x,
        y,
        opacity,
        effects,
        visible,
      } = rectData;

      const rect = figma.createRectangle();
      rect.name = name || `Rectangle ${index !== undefined ? index + 1 : ""}`;
      rect.resize(width || 100, height || 100);

      // Set position
      if (x !== undefined) rect.x = x;
      if (y !== undefined) rect.y = y;

      // Set fills
      if (fills && Array.isArray(fills)) {
        try {
          rect.fills = fills as Paint[];
        } catch (e) {
          console.error("Error setting fills:", e);
        }
      }

      // Set strokes
      if (strokes && Array.isArray(strokes)) {
        try {
          rect.strokes = strokes as Paint[];
        } catch (e) {
          console.error("Error setting strokes:", e);
        }
      }

      if (strokeWeight !== undefined) rect.strokeWeight = strokeWeight;
      if (strokeAlign) rect.strokeAlign = strokeAlign;

      // Set corner radius
      if (cornerRadius !== undefined) {
        rect.cornerRadius = cornerRadius;
      } else {
        // Set individual corner radius
        if (topLeftRadius !== undefined) rect.topLeftRadius = topLeftRadius;
        if (topRightRadius !== undefined) rect.topRightRadius = topRightRadius;
        if (bottomLeftRadius !== undefined)
          rect.bottomLeftRadius = bottomLeftRadius;
        if (bottomRightRadius !== undefined)
          rect.bottomRightRadius = bottomRightRadius;
      }

      // Set opacity
      if (opacity !== undefined) rect.opacity = opacity;

      // Set effects
      if (effects && Array.isArray(effects)) {
        try {
          rect.effects = effects as Effect[];
        } catch (e) {
          console.error("Error setting effects:", e);
        }
      }

      // Set visibility
      if (visible !== undefined) rect.visible = visible;

      // Add to current page
      figma.currentPage.appendChild(rect);

      resolve(rect);
    } catch (error) {
      console.error("Error creating rectangle:", error);
      reject(error);
    }
  });
}
