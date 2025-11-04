// Function to create ellipse element
export function createEllipseElement(
  ellipseData: {
    name?: string;
    width?: number;
    height?: number;
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    strokeAlign?: "INSIDE" | "OUTSIDE" | "CENTER";
    arcData?: {
      startingAngle: number;
      endingAngle: number;
      innerRadius: number;
    };
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
        arcData,
        x,
        y,
        opacity,
        effects,
        visible,
      } = ellipseData;

      const ellipse = figma.createEllipse();
      ellipse.name = name || `Ellipse ${index !== undefined ? index + 1 : ""}`;
      ellipse.resize(width || 100, height || 100);

      // Set position
      if (x !== undefined) ellipse.x = x;
      if (y !== undefined) ellipse.y = y;

      // Set fills
      if (fills && Array.isArray(fills)) {
        try {
          ellipse.fills = fills as Paint[];
        } catch (e) {
          console.error("Error setting fills:", e);
        }
      }

      // Set strokes
      if (strokes && Array.isArray(strokes)) {
        try {
          ellipse.strokes = strokes as Paint[];
        } catch (e) {
          console.error("Error setting strokes:", e);
        }
      }

      if (strokeWeight !== undefined) ellipse.strokeWeight = strokeWeight;
      if (strokeAlign) ellipse.strokeAlign = strokeAlign;

      // Set arc data
      if (arcData) {
        ellipse.arcData = arcData;
      }

      // Set opacity
      if (opacity !== undefined) ellipse.opacity = opacity;

      // Set effects
      if (effects && Array.isArray(effects)) {
        try {
          ellipse.effects = effects as Effect[];
        } catch (e) {
          console.error("Error setting effects:", e);
        }
      }

      // Set visibility
      if (visible !== undefined) ellipse.visible = visible;

      // Add to current page
      figma.currentPage.appendChild(ellipse);

      resolve(ellipse);
    } catch (error) {
      console.error("Error creating ellipse:", error);
      reject(error);
    }
  });
}
