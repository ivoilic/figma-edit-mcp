// Function to create component element
export const createComponentElement = (
  componentData: {
    name?: string;
    description?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    strokeAlign?: "INSIDE" | "OUTSIDE" | "CENTER";
    cornerRadius?: number;
    opacity?: number;
    effects?: Effect[];
    visible?: boolean;
  },
  index?: number
) => {
  const {
    name,
    description,
    x,
    y,
    width,
    height,
    fills,
    strokes,
    strokeWeight,
    strokeAlign,
    cornerRadius,
    opacity,
    effects,
    visible,
  } = componentData;
  const component = figma.createComponent();
  component.name = name || `Component ${index !== undefined ? index + 1 : ""}`;

  if (description) {
    component.description = description;
  }

  component.resize(width || 100, height || 100);

  // Set position
  if (x !== undefined) component.x = x;
  if (y !== undefined) component.y = y;

  // Set fills
  if (fills && Array.isArray(fills)) {
    try {
      component.fills = fills as Paint[];
    } catch (e) {
      console.error("Error setting fills:", e);
    }
  }

  // Set strokes
  if (strokes && Array.isArray(strokes)) {
    try {
      component.strokes = strokes as Paint[];
    } catch (e) {
      console.error("Error setting strokes:", e);
    }
  }

  if (strokeWeight !== undefined) component.strokeWeight = strokeWeight;
  if (strokeAlign) component.strokeAlign = strokeAlign;

  // Set corner radius
  if (cornerRadius !== undefined) component.cornerRadius = cornerRadius;

  // Set opacity
  if (opacity !== undefined) component.opacity = opacity;

  // Set effects
  if (effects && Array.isArray(effects)) {
    try {
      component.effects = effects as Effect[];
    } catch (e) {
      console.error("Error setting effects:", e);
    }
  }

  // Set visibility
  if (visible !== undefined) component.visible = visible;

  // Add to current page
  figma.currentPage.appendChild(component);

  return component;
};
