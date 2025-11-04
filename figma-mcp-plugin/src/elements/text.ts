import { logToUI } from "../utils/logger";

// Function to create text element
export function createTextElement(
  textData: {
    name?: string;
    characters?: string;
    fontSize?: number;
    fills?: SolidPaint[];
    x?: number;
    y?: number;
    fontWeight?: string;
    width?: number;
    textAutoResize?: "NONE" | "WIDTH_AND_HEIGHT" | "HEIGHT";
    paragraphSpacing?: number;
    lineHeight?: { value: number; unit: "PIXELS" | "PERCENT" };
  },
  index?: number
) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // Return error if characters parameter is missing
      if (!textData.characters) {
        const error = new Error(
          "Property 'characters' is required for text elements"
        );
        logToUI(
          "Failed to create text element: characters parameter is required",
          "error"
        );
        figma.notify(
          "Failed to create text element: characters parameter is required",
          { error: true }
        );
        reject(error);
        return;
      }
      const {
        name,
        characters,
        fontSize,
        fills,
        x,
        y,
        fontWeight,
        width,
        textAutoResize,
        paragraphSpacing,
        lineHeight,
      } = textData;
      const text = figma.createText();
      text.name = name || `New Text ${index !== undefined ? index + 1 : ""}`;

      // Set position
      if (x !== undefined) text.x = x;
      if (y !== undefined) text.y = y;

      // Wait for font loading (processed synchronously with await)
      const fontStyle = fontWeight === "Bold" ? "Bold" : "Regular";

      try {
        // Always load font (completes quickly if cached)
        await figma.loadFontAsync({ family: "Inter", style: fontStyle });

        // Set text after font is loaded
        text.characters = characters;
        if (fontSize) text.fontSize = fontSize;
        if (fontWeight === "Bold")
          text.fontName = { family: "Inter", style: "Bold" };

        // Set text auto-resize mode
        if (textAutoResize) {
          text.textAutoResize = textAutoResize;
        } else {
          // Default: fixed width, auto height
          text.textAutoResize = "HEIGHT";
        }

        // Set width if specified
        if (width) {
          text.resize(width, text.height);
        } else if (characters.length > 20) {
          // Set default width for long text
          text.resize(300, text.height);
        }

        // Set paragraph spacing
        if (paragraphSpacing !== undefined) {
          text.paragraphSpacing = paragraphSpacing;
        }

        // Set line height
        if (lineHeight) {
          text.lineHeight = lineHeight;
        }

        // Set fills
        if (fills && Array.isArray(fills)) {
          try {
            const solidFills = fills as SolidPaint[];
            text.fills = solidFills;
          } catch (e) {
            console.error("Error setting text fills:", e);
          }
        }

        // Add to current page
        figma.currentPage.appendChild(text);
        resolve();
      } catch (e) {
        console.error("Error loading font:", e);
        reject(e);
      }
    } catch (error) {
      console.error("Error creating text element:", error);
      reject(error);
    }
  });
}
