// Function to create image element
export const createImageElement = (
  imageData: {
    name?: string;
    imageUrl: string;
    width?: number;
    height?: number;
    scaleMode?: "FILL" | "FIT" | "CROP" | "TILE";
    x?: number;
    y?: number;
    opacity?: number;
    effects?: Effect[];
    visible?: boolean;
  },
  index?: number
) => {
  const {
    name,
    imageUrl,
    width,
    height,
    scaleMode,
    x,
    y,
    opacity,
    effects,
    visible,
  } = imageData;

  // Create Rectangle for image insertion
  const rect = figma.createRectangle();
  rect.name = name || `Image ${index !== undefined ? index + 1 : ""}`;
  rect.resize(width || 100, height || 100);

  // Set position
  if (x !== undefined) rect.x = x;
  if (y !== undefined) rect.y = y;

  // Get image from URL for use in Figma (async processing)
  figma
    .createImageAsync(imageUrl)
    .then((image) => {
      // Set image as fill
      const imageFill: ImagePaint = {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: scaleMode || "FILL",
      };

      rect.fills = [imageFill];

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
    })
    .catch((error) => {
      console.error("Error creating image:", error);
      // Display red rectangle on error
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }];
    });

  // Add to current page
  figma.currentPage.appendChild(rect);

  return rect;
};
