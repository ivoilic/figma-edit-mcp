// Function to create line element
export const createLineElement = (
  lineData: {
    name?: string;
    strokes?: Paint[];
    strokeWeight?: number;
    strokeCap?:
      | "NONE"
      | "ROUND"
      | "SQUARE"
      | "ARROW_LINES"
      | "ARROW_EQUILATERAL";
    points: { x: number; y: number }[];
    opacity?: number;
    effects?: Effect[];
    visible?: boolean;
  },
  index?: number
) => {
  const {
    name,
    strokes,
    strokeWeight,
    strokeCap,
    points,
    opacity,
    effects,
    visible,
  } = lineData;

  if (!points || points.length < 2) {
    console.error("Error: Line requires at least 2 points");
    return null;
  }

  // Line start and end points
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  // Create line (actually uses vector network)
  const line = figma.createLine();
  line.name = name || `Line ${index !== undefined ? index + 1 : ""}`;

  // Set start and end points
  line.x = startPoint.x;
  line.y = startPoint.y;
  line.resize(
    Math.abs(endPoint.x - startPoint.x) || 1,
    Math.abs(endPoint.y - startPoint.y) || 1
  );

  // Set strokes
  if (strokes && Array.isArray(strokes)) {
    try {
      line.strokes = strokes as Paint[];
    } catch (e) {
      console.error("Error setting strokes:", e);
    }
  } else {
    // Default stroke
    line.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  }

  if (strokeWeight !== undefined) line.strokeWeight = strokeWeight;
  if (strokeCap) line.strokeCap = strokeCap;

  // Set opacity
  if (opacity !== undefined) line.opacity = opacity;

  // Set effects
  if (effects && Array.isArray(effects)) {
    try {
      line.effects = effects as Effect[];
    } catch (e) {
      console.error("Error setting effects:", e);
    }
  }

  // Set visibility
  if (visible !== undefined) line.visible = visible;

  // Add to current page
  figma.currentPage.appendChild(line);

  return line;
};
