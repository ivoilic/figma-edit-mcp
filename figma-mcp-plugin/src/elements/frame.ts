// Function to process frame creation
export const createFrameElement = (frameData: {
  name?: string;
  width?: number;
  height?: number;
  fills?: Paint[];
  x?: number;
  y?: number;
  cornerRadius?: number;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  opacity?: number;
  effects?: Effect[];
  visible?: boolean;
}) => {
  const {
    name,
    width,
    height,
    fills,
    x,
    y,
    cornerRadius,
    layoutMode,
    primaryAxisSizingMode,
    counterAxisSizingMode,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    itemSpacing,
    strokes,
    strokeWeight,
    strokeAlign,
    opacity,
    effects,
    visible,
  } = frameData;

  const frame = figma.createFrame();
  frame.name = name || 'New Frame';
  frame.resize(width || 100, height || 100);

  // Set position
  if (x !== undefined) frame.x = x;
  if (y !== undefined) frame.y = y;

  // Set fills
  if (fills && Array.isArray(fills)) {
    try {
      frame.fills = fills as Paint[];
    } catch (e) {
      console.error('Error setting fills:', e);
    }
  }

  // Set corner radius
  if (cornerRadius !== undefined) frame.cornerRadius = cornerRadius;

  // Set layout mode
  if (layoutMode) {
    frame.layoutMode = layoutMode;

    if (primaryAxisSizingMode)
      frame.primaryAxisSizingMode = primaryAxisSizingMode;
    if (counterAxisSizingMode)
      frame.counterAxisSizingMode = counterAxisSizingMode;

    if (paddingLeft !== undefined) frame.paddingLeft = paddingLeft;
    if (paddingRight !== undefined) frame.paddingRight = paddingRight;
    if (paddingTop !== undefined) frame.paddingTop = paddingTop;
    if (paddingBottom !== undefined) frame.paddingBottom = paddingBottom;

    if (itemSpacing !== undefined) frame.itemSpacing = itemSpacing;
  }

  // Set strokes
  if (strokes && Array.isArray(strokes)) {
    try {
      frame.strokes = strokes as Paint[];
    } catch (e) {
      console.error('Error setting strokes:', e);
    }
  }

  if (strokeWeight !== undefined) frame.strokeWeight = strokeWeight;
  if (strokeAlign) frame.strokeAlign = strokeAlign;

  // Set opacity
  if (opacity !== undefined) frame.opacity = opacity;

  // Set effects
  if (effects && Array.isArray(effects)) {
    try {
      frame.effects = effects as Effect[];
    } catch (e) {
      console.error('Error setting effects:', e);
    }
  }

  // Set visibility
  if (visible !== undefined) frame.visible = visible;

  // Add to current page
  figma.currentPage.appendChild(frame);

  // Move viewport to new frame
  figma.viewport.scrollAndZoomIntoView([frame]);

  return frame;
};

