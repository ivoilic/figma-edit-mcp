// Communication settings with MCP server
const MCP_SERVER_URL = "http://localhost:5678";
const DEBUG = false; // Disable debug mode

// Log output function (only logs needed for UI)
function logToUI(message: string, type: "log" | "error" = "log") {
  try {
    figma.ui.postMessage({
      type: type === "error" ? "error" : "log",
      message: message,
    });
  } catch (e) {
    console.error("Error sending message to UI:", e);
  }
}

// Initialize plugin
if (DEBUG) console.log("[code.ts] Plugin initializing...");
figma.showUI(__html__, { width: 300, height: 400 });
if (DEBUG) console.log("[code.ts] UI shown");

// Track font loading status
let fontsLoaded = false;

// Preload commonly used fonts
Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
])
  .then(() => {
    if (DEBUG) console.log("[code.ts] Fonts loaded successfully");
    logToUI("Fonts loaded successfully");
    fontsLoaded = true;
    // Connect to server after fonts are loaded
    healthcheckWithServer();
  })
  .catch((error) => {
    console.error("Error preloading fonts:", error);
    logToUI("Failed to load fonts, but attempting to connect anyway", "error");
    // Attempt to connect even if error occurs
    healthcheckWithServer();
  });

// Get plugin ID and file ID
const pluginId = figma.root.getPluginData("pluginId") || `plugin-${Date.now()}`;
const fileId = figma.fileKey || `local-file-${Date.now()}`;

// Save plugin ID
figma.root.setPluginData("pluginId", pluginId);

// WebSocket connection is handled by the UI (which has access to WebSocket API)
// The plugin code communicates with the UI via postMessage

// Register plugin with MCP server
async function healthcheckWithServer() {
  try {
    logToUI("Registering with MCP server...");
    const response = await fetch(`${MCP_SERVER_URL}/plugin/healthcheck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pluginId,
        fileId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Server responded with ${response.status}: ${response.statusText}`
      );
    }

    // After healthcheck, ask UI to connect via WebSocket
    figma.ui.postMessage({
      type: "connect-websocket",
      pluginId,
      fileId,
    });
  } catch (error: unknown) {
    console.error("Failed to register with MCP server:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Failed to register with MCP server: ${errorMessage}`, "error");
    figma.ui.postMessage({ type: "connection-error", error: errorMessage });
  }
}

// Apply updates to Figma design
async function applyUpdates(updates: any) {
  try {
    if (DEBUG)
      console.log(
        "[applyUpdates] Received updates:",
        JSON.stringify(updates, null, 2)
      );
    logToUI("[applyUpdates] Received updates: " + JSON.stringify(updates));

    // Process updates
    if (updates && updates.updates && Array.isArray(updates.updates)) {
      // Format from MCP server (updates.updates format)
      if (DEBUG)
        console.log(
          `[applyUpdates] Processing ${updates.updates.length} updates`
        );
      logToUI(`[applyUpdates] Processing ${updates.updates.length} updates`);

      // Process each update
      for (const update of updates.updates) {
        const { type, data } = update;
        if (!type) continue;

        if (DEBUG)
          console.log(`[applyUpdates] Processing update type: ${type}`);
        logToUI(`[applyUpdates] Processing update type: ${type}`);

        if (type === "updateNode") {
          if (DEBUG)
            console.log(
              `[applyUpdates] updateNode data:`,
              JSON.stringify(data, null, 2)
            );
          logToUI(`[applyUpdates] updateNode data: ${JSON.stringify(data)}`);

          if (data.properties && data.properties.fills) {
            if (DEBUG)
              console.log(
                `[applyUpdates] Fills in updateNode:`,
                JSON.stringify(data.properties.fills, null, 2)
              );
            logToUI(
              `[applyUpdates] Fills in updateNode: ${JSON.stringify(
                data.properties.fills
              )}`
            );
          }
        }

        // Process new low-level operations
        if (type === "createNode") {
          await createNode(data);
        } else if (type === "updateNode") {
          await updateNode(data);
        } else if (type === "deleteNode") {
          await deleteNode(data);
        } else {
          // Legacy format update (for compatibility)
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else if (Array.isArray(updates)) {
      // Array format case (for compatibility)
      // Process each update
      for (const update of updates) {
        const { type, data } = update;
        if (!type) continue;

        // Process new low-level operations
        if (type === "createNode") {
          await createNode(data);
        } else if (type === "updateNode") {
          await updateNode(data);
        } else if (type === "deleteNode") {
          await deleteNode(data);
        } else {
          // Legacy format update (for compatibility)
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else {
      // Legacy format update (for compatibility)
      await processUpdates(updates);
    }

    logToUI("Design updated successfully");
    figma.notify("Design updated successfully");
  } catch (error: unknown) {
    console.error("Failed to apply updates:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Failed to apply updates: ${errorMessage}`, "error");
    figma.notify("Error occurred while updating design", { error: true });
  }
}

// Function to process updates
async function processUpdates(updates: any) {
  // Create frame
  if (updates.createFrame) {
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
    } = updates.createFrame;

    const frame = figma.createFrame();
    frame.name = name || "New Frame";
    frame.resize(width || 100, height || 100);

    // Set position
    if (x !== undefined) frame.x = x;
    if (y !== undefined) frame.y = y;

    // Set fills
    if (fills && Array.isArray(fills)) {
      try {
        frame.fills = fills as Paint[];
      } catch (e) {
        console.error("Error setting fills:", e);
      }
    }

    // Set corner radius
    if (cornerRadius !== undefined) frame.cornerRadius = cornerRadius;

    // Set layout mode
    if (layoutMode) {
      frame.layoutMode = layoutMode as "NONE" | "HORIZONTAL" | "VERTICAL";

      if (primaryAxisSizingMode)
        frame.primaryAxisSizingMode = primaryAxisSizingMode as "FIXED" | "AUTO";
      if (counterAxisSizingMode)
        frame.counterAxisSizingMode = counterAxisSizingMode as "FIXED" | "AUTO";

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
        console.error("Error setting strokes:", e);
      }
    }

    if (strokeWeight !== undefined) frame.strokeWeight = strokeWeight;
    if (strokeAlign)
      frame.strokeAlign = strokeAlign as "INSIDE" | "OUTSIDE" | "CENTER";

    // Set opacity
    if (opacity !== undefined) frame.opacity = opacity;

    // Set effects
    if (effects && Array.isArray(effects)) {
      try {
        frame.effects = effects as Effect[];
      } catch (e) {
        console.error("Error setting effects:", e);
      }
    }

    // Set visibility
    if (visible !== undefined) frame.visible = visible;

    // Add to current page
    figma.currentPage.appendChild(frame);

    // Move viewport to new frame
    figma.viewport.scrollAndZoomIntoView([frame]);
  }

  // Create text elements
  if (updates.createText) {
    if (Array.isArray(updates.createText)) {
      // If array, process each element
      await Promise.all(
        updates.createText.map((textData: any, index: number) =>
          createTextElement(textData, index)
        )
      );
    } else {
      // Single object case
      await createTextElement(updates.createText);
    }
  }

  // Create rectangles
  if (updates.createRectangle) {
    if (Array.isArray(updates.createRectangle)) {
      // If array, process each element
      await Promise.all(
        updates.createRectangle.map((rectData: any, index: number) =>
          createRectangleElement(rectData, index)
        )
      );
    } else {
      // Single object case
      await createRectangleElement(updates.createRectangle);
    }
  }

  // Create ellipses
  if (updates.createEllipse) {
    if (Array.isArray(updates.createEllipse)) {
      // If array, process each element
      await Promise.all(
        updates.createEllipse.map((ellipseData: any, index: number) =>
          createEllipseElement(ellipseData, index)
        )
      );
    } else {
      // Single object case
      await createEllipseElement(updates.createEllipse);
    }
  }

  // Create lines
  if (updates.createLine) {
    if (Array.isArray(updates.createLine)) {
      // If array, process each element
      updates.createLine.forEach((lineData: any, index: number) => {
        createLineElement(lineData, index);
      });
    } else {
      // Single object case
      createLineElement(updates.createLine);
    }
  }

  // Insert images
  if (updates.createImage) {
    if (Array.isArray(updates.createImage)) {
      // If array, process each element
      updates.createImage.forEach((imageData: any, index: number) => {
        createImageElement(imageData, index);
      });
    } else {
      // Single object case
      createImageElement(updates.createImage);
    }
  }

  // Create components
  if (updates.createComponent) {
    if (Array.isArray(updates.createComponent)) {
      // If array, process each element
      updates.createComponent.forEach((componentData: any, index: number) => {
        createComponentElement(componentData, index);
      });
    } else {
      // Single object case
      createComponentElement(updates.createComponent);
    }
  }
}

// Function to create text elements
function createTextElement(
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

      // Wait for font loading (process synchronously using await)
      const fontStyle = fontWeight === "Bold" ? "Bold" : "Regular";

      try {
        // Always load font (will complete quickly if cached)
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

// Function to create rectangles
function createRectangleElement(
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

      // 位置の設定
      if (x !== undefined) rect.x = x;
      if (y !== undefined) rect.y = y;

      // 塗りつぶしの設定
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

// Function to create ellipses
function createEllipseElement(
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

      // 位置の設定
      if (x !== undefined) ellipse.x = x;
      if (y !== undefined) ellipse.y = y;

      // 塗りつぶしの設定
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

// Function to create lines
function createLineElement(
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
) {
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

  // ストロークの設定
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

  // 透明度の設定
  if (opacity !== undefined) line.opacity = opacity;

  // エフェクトの設定
  if (effects && Array.isArray(effects)) {
    try {
      line.effects = effects as Effect[];
    } catch (e) {
      console.error("Error setting effects:", e);
    }
  }

  // 表示/非表示の設定
  if (visible !== undefined) line.visible = visible;

  // 現在のページに追加
  figma.currentPage.appendChild(line);

  return line;
}

// Insert image
function createImageElement(
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
) {
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

  // 位置の設定
  if (x !== undefined) rect.x = x;
  if (y !== undefined) rect.y = y;

  // Get image usable in Figma from image URL (asynchronous processing)
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

  // 現在のページに追加
  figma.currentPage.appendChild(rect);

  return rect;
}

// コンポーネントの作成
function createComponentElement(
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
) {
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

  // 位置の設定
  if (x !== undefined) component.x = x;
  if (y !== undefined) component.y = y;

  // 塗りつぶしの設定
  if (fills && Array.isArray(fills)) {
    try {
      component.fills = fills as Paint[];
    } catch (e) {
      console.error("Error setting fills:", e);
    }
  }

  // ストロークの設定
  if (strokes && Array.isArray(strokes)) {
    try {
      component.strokes = strokes as Paint[];
    } catch (e) {
      console.error("Error setting strokes:", e);
    }
  }

  if (strokeWeight !== undefined) component.strokeWeight = strokeWeight;
  if (strokeAlign) component.strokeAlign = strokeAlign;

  // 角丸の設定
  if (cornerRadius !== undefined) component.cornerRadius = cornerRadius;

  // 透明度の設定
  if (opacity !== undefined) component.opacity = opacity;

  // エフェクトの設定
  if (effects && Array.isArray(effects)) {
    try {
      component.effects = effects as Effect[];
    } catch (e) {
      console.error("Error setting effects:", e);
    }
  }

  // 表示/非表示の設定
  if (visible !== undefined) component.visible = visible;

  // 現在のページに追加
  figma.currentPage.appendChild(component);

  return component;
}

// Low-level: Create any node type
async function createNode(data: {
  nodeType: string;
  properties: Record<string, any>;
  parentId?: string;
}) {
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
        const fontFamily = properties.fontName?.family || "Inter";
        const fontStyle =
          properties.fontName?.style || properties.fontWeight || "Regular";
        try {
          await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
          (node as TextNode).characters = properties.characters;
        } catch (e) {
          console.error("Error loading font:", e);
          // Try default font
          try {
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            (node as TextNode).characters = properties.characters;
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
  await applyPropertiesToNode(node, properties);

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
}

// Low-level: Update node properties
async function updateNode(data: {
  nodeId: string;
  properties?: Record<string, any>;
  parentId?: string;
  index?: number;
}) {
  const { nodeId, properties, parentId, index } = data;

  if (DEBUG) console.log(`[updateNode] Starting update for node ${nodeId}`);
  logToUI(`[updateNode] Starting update for node ${nodeId}`);

  const node = findNodeById(nodeId);
  if (!node) {
    const error = `Node with id ${nodeId} not found`;
    console.error(`[updateNode] ${error}`);
    logToUI(`[updateNode] ${error}`, "error");
    throw new Error(error);
  }

  if (DEBUG)
    console.log(`[updateNode] Found node: ${node.name} (${node.type})`);
  logToUI(`[updateNode] Found node: ${node.name} (${node.type})`);

  // Change parent node if needed
  if (parentId !== undefined) {
    const newParent = findNodeById(parentId);
    if (newParent && "appendChild" in newParent) {
      const parent = newParent as ChildrenMixin;
      if (index !== undefined) {
        parent.insertChild(index, node);
      } else {
        parent.appendChild(node);
      }
    }
  }

  // Update properties
  if (properties) {
    if (DEBUG)
      console.log(
        `[updateNode] Properties received:`,
        JSON.stringify(properties, null, 2)
      );
    logToUI(`[updateNode] Properties received: ${JSON.stringify(properties)}`);

    if (properties.fills) {
      if (DEBUG)
        console.log(
          `[updateNode] Fills in properties:`,
          JSON.stringify(properties.fills, null, 2)
        );
      logToUI(
        `[updateNode] Fills in properties: ${JSON.stringify(properties.fills)}`
      );
    }

    await applyPropertiesToNode(node, properties);

    // Log what was actually set
    if ("fills" in node) {
      const paintNode = node as GeometryMixin;
      if (DEBUG)
        console.log(
          `[updateNode] Fills after applying:`,
          JSON.stringify(paintNode.fills, null, 2)
        );
      logToUI(
        `[updateNode] Fills after applying: ${JSON.stringify(paintNode.fills)}`
      );
    }
  } else {
    if (DEBUG) console.log(`[updateNode] No properties to update`);
    logToUI(`[updateNode] No properties to update`);
  }

  if (DEBUG) console.log(`[updateNode] Update complete for node ${nodeId}`);
  logToUI(`[updateNode] Update complete for node ${nodeId}`);
}

// Low-level: Delete node
function deleteNode(data: { nodeId: string }) {
  const { nodeId } = data;

  const node = findNodeById(nodeId);
  if (!node) {
    throw new Error(`Node with id ${nodeId} not found`);
  }

  node.remove();
}

// Search for node by ID (recursive, search all pages)
function findNodeById(nodeId: string): SceneNode | null {
  function search(node: BaseNode): SceneNode | null {
    // Directly compare node IDs (supports both Figma REST API ID format and plugin API ID format)
    if (node.id === nodeId && "type" in node) {
      return node as SceneNode;
    }

    // Search nodes with children
    if ("children" in node) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }

    return null;
  }

  // First search root (usually DocumentNode)
  const rootResult = search(figma.root);
  if (rootResult) return rootResult;

  // Search all pages
  for (const page of figma.root.children) {
    const pageResult = search(page);
    if (pageResult) return pageResult;
  }

  return null;
}

// Generic function to apply properties to node
async function applyPropertiesToNode(
  node: SceneNode,
  properties: Record<string, any>
) {
  // Basic properties
  if (properties.name !== undefined) node.name = properties.name;
  if (properties.x !== undefined) node.x = properties.x;
  if (properties.y !== undefined) node.y = properties.y;
  if (properties.opacity !== undefined && "opacity" in node) {
    (node as any).opacity = properties.opacity;
  }
  if (properties.visible !== undefined) node.visible = properties.visible;
  if (properties.blendMode !== undefined && "blendMode" in node) {
    (node as any).blendMode = properties.blendMode;
  }

  // Layout-capable nodes
  if ("resize" in node) {
    const layoutNode = node as LayoutMixin;
    if (properties.width !== undefined || properties.height !== undefined) {
      const width =
        properties.width !== undefined ? properties.width : layoutNode.width;
      const height =
        properties.height !== undefined ? properties.height : layoutNode.height;
      layoutNode.resize(width, height);
    }
  }

  // Handle boundVariables for simple fields (width, height, etc.) - fills/strokes handled separately
  // Note: Only process fills/strokes/effects in boundVariables after fills/strokes arrays are set
  if (properties.boundVariables !== undefined) {
    const boundVars = properties.boundVariables as Record<string, any>;
    if (DEBUG)
      console.log(
        "[applyPropertiesToNode] Processing boundVariables (excluding fills/strokes/effects):",
        JSON.stringify(boundVars, null, 2)
      );

    // Detect common error: boundVariables at top level for fills/strokes
    if (boundVars.fills || boundVars.strokes) {
      console.warn(
        "[applyPropertiesToNode] WARNING: boundVariables.fills or boundVariables.strokes found at top level. " +
          "This format is deprecated. Put boundVariables INSIDE each fill/stroke object instead. " +
          "Example: {fills: [{type: 'SOLID', boundVariables: {color: {type: 'VARIABLE_ALIAS', id: 'VariableID:27:17'}}}]}"
      );
      figma.notify(
        "Variable binding format error: boundVariables must be inside each fill/stroke object, not at top level",
        { error: true }
      );
    }

    // Skip fills/strokes/effects - they're handled separately after the fills/strokes arrays are set
    const fieldsToSkip = ["fills", "strokes", "effects"];

    // Handle simple fields like width, height, opacity (not fills/strokes/effects)
    for (const [field, alias] of Object.entries(boundVars)) {
      if (fieldsToSkip.includes(field)) {
        continue; // Skip - handled separately
      }

      // Simple field binding - extract variable ID from VARIABLE_ALIAS
      try {
        if (alias && typeof alias === "object" && alias.id) {
          const variableId = alias.id.startsWith("VariableID:")
            ? alias.id
            : `VariableID:${alias.id}`;
          const variable = await figma.variables.getVariableByIdAsync(
            variableId
          );
          if (!variable) {
            console.warn(
              `[applyPropertiesToNode] Variable ${variableId} not found for field ${field}`
            );
            continue;
          }

          // Check if node supports setBoundVariable
          if (
            !("setBoundVariable" in node) ||
            typeof (node as any).setBoundVariable !== "function"
          ) {
            console.warn(
              `[applyPropertiesToNode] Node does not support setBoundVariable for field ${field}`
            );
            continue;
          }

          // Try to bind the variable
          try {
            (node as any).setBoundVariable(field, variable);
            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Bound variable ${variableId} to field ${field}`
              );
          } catch (bindError) {
            // This field doesn't support variable binding
            console.warn(
              `[applyPropertiesToNode] Cannot bind variable to field ${field}:`,
              bindError
            );
          }
        }
      } catch (e) {
        // Error processing this field - log and continue
        console.warn(
          `[applyPropertiesToNode] Error processing boundVariable for field ${field}:`,
          e
        );
      }
    }
  }

  // Fills and strokes (support variables)
  if ("fills" in node) {
    const paintNode = node as GeometryMixin;
    if (properties.fills !== undefined) {
      try {
        if (DEBUG)
          console.log(
            "[applyPropertiesToNode] Processing fills, input:",
            JSON.stringify(properties.fills, null, 2)
          );

        // Support variable references in fills and normalize opacity
        const fills: any[] = [];
        for (let index = 0; index < properties.fills.length; index++) {
          const fill = properties.fills[index];
          if (DEBUG)
            console.log(
              `[applyPropertiesToNode] Processing fill ${index}:`,
              JSON.stringify(fill, null, 2)
            );

          if (fill.type === "VARIABLE" && fill.variableId) {
            // Variable paint is already in the correct format
            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Fill ${index} is VARIABLE type, returning as-is`
              );
            fills.push(fill);
            continue;
          }

          // Handle boundVariables with VARIABLE_ALIAS format
          // Format: { type: "SOLID", boundVariables: { color: { type: "VARIABLE_ALIAS", id: "VariableID:27:17" } } }
          if (fill.boundVariables && fill.boundVariables.color) {
            const alias = fill.boundVariables.color;
            if (alias.type === "VARIABLE_ALIAS" && alias.id) {
              const variableId = alias.id.startsWith("VariableID:")
                ? alias.id
                : `VariableID:${alias.id}`;
              const variable = await figma.variables.getVariableByIdAsync(
                variableId
              );
              if (variable) {
                // Use Figma's helper method to bind variable to paint
                // Create a base paint first if needed - ensure color.a is removed
                let paint: SolidPaint;
                if (fill.type === "SOLID") {
                  // Normalize the paint - remove color.a if it exists
                  const color = fill.color
                    ? { ...fill.color }
                    : { r: 0, g: 0, b: 0 };
                  if ("a" in color) {
                    delete (color as any).a;
                  }
                  paint = {
                    type: "SOLID",
                    color: color as { r: number; g: number; b: number },
                    opacity: fill.opacity !== undefined ? fill.opacity : 1,
                    visible: fill.visible !== false,
                  };
                } else {
                  paint = {
                    type: "SOLID",
                    color: { r: 0, g: 0, b: 0 },
                    opacity: fill.opacity !== undefined ? fill.opacity : 1,
                    visible: fill.visible !== false,
                  };
                }
                const boundPaint = figma.variables.setBoundVariableForPaint(
                  paint,
                  "color",
                  variable
                );
                if (DEBUG)
                  console.log(
                    `[applyPropertiesToNode] Bound variable ${variableId} to fill ${index} color`
                  );
                fills.push(boundPaint);
                continue;
              } else {
                console.warn(
                  `[applyPropertiesToNode] Variable ${variableId} not found for fill ${index}, continuing with normal processing`
                );
              }
            }
          }

          // For SOLID paints, ensure opacity is properly set
          if (fill.type === "SOLID") {
            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Fill ${index} is SOLID type, normalizing...`
              );
            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Fill ${index} - opacity in input:`,
                fill.opacity
              );
            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Fill ${index} - color.a in input:`,
                fill.color?.a
              );

            // Create a new fill object with opacity preserved
            const normalizedFill: any = {
              type: "SOLID",
            };

            // Handle color - ALWAYS remove 'a' as Figma API doesn't allow it in color objects
            if (fill.color) {
              const color = { ...fill.color };
              // Always remove 'a' from color - Figma doesn't allow it in color objects
              if ("a" in color) {
                if (DEBUG)
                  console.log(
                    `[applyPropertiesToNode] Fill ${index} - Removing color.a (${color.a})`
                  );
                delete (color as any).a;
              }
              normalizedFill.color = color as {
                r: number;
                g: number;
                b: number;
              };
              if (DEBUG)
                console.log(
                  `[applyPropertiesToNode] Fill ${index} - Normalized color:`,
                  JSON.stringify(color)
                );
            } else {
              normalizedFill.color = { r: 0, g: 0, b: 0 };
            }

            // Set opacity if provided
            if (fill.opacity !== undefined) {
              normalizedFill.opacity = fill.opacity;
              if (DEBUG)
                console.log(
                  `[applyPropertiesToNode] Fill ${index} - Set opacity to:`,
                  fill.opacity
                );
            }

            // Preserve other properties
            if (fill.blendMode !== undefined)
              normalizedFill.blendMode = fill.blendMode;
            if (fill.visible !== undefined)
              normalizedFill.visible = fill.visible;

            if (DEBUG)
              console.log(
                `[applyPropertiesToNode] Fill ${index} normalized result:`,
                JSON.stringify(normalizedFill, null, 2)
              );
            fills.push(normalizedFill);
            continue;
          }
          if (DEBUG)
            console.log(
              `[applyPropertiesToNode] Fill ${index} is not SOLID or VARIABLE, returning as-is`
            );
          fills.push(fill);
        }

        if (DEBUG)
          console.log(
            "[applyPropertiesToNode] All normalized fills:",
            JSON.stringify(fills, null, 2)
          );
        paintNode.fills = fills as Paint[];
        if (DEBUG)
          console.log(
            "[applyPropertiesToNode] Fills set on node. Verifying what was actually set..."
          );
        if (DEBUG)
          console.log(
            "[applyPropertiesToNode] Node fills after assignment:",
            JSON.stringify(paintNode.fills, null, 2)
          );

        // Handle top-level boundVariables.fills after fills are set
        const boundVars = properties.boundVariables as
          | Record<string, any>
          | undefined;
        if (boundVars && boundVars.fills && Array.isArray(boundVars.fills)) {
          const fillsCopy = [...paintNode.fills];
          for (let index = 0; index < boundVars.fills.length; index++) {
            const alias = boundVars.fills[index];
            if (
              alias &&
              alias.type === "VARIABLE_ALIAS" &&
              alias.id &&
              fillsCopy[index]
            ) {
              const variableId = alias.id.startsWith("VariableID:")
                ? alias.id
                : `VariableID:${alias.id}`;
              const variable = await figma.variables.getVariableByIdAsync(
                variableId
              );
              if (variable && fillsCopy[index].type === "SOLID") {
                // Normalize the paint before binding - ensure color.a is removed
                const existingPaint = fillsCopy[index] as SolidPaint;
                const normalizedPaint: SolidPaint = {
                  type: "SOLID",
                  color:
                    existingPaint.color &&
                    typeof existingPaint.color === "object" &&
                    !("a" in existingPaint.color)
                      ? existingPaint.color
                      : existingPaint.color &&
                        typeof existingPaint.color === "object"
                      ? (() => {
                          const color = { ...existingPaint.color };
                          if ("a" in color) {
                            delete (color as any).a;
                          }
                          return color as { r: number; g: number; b: number };
                        })()
                      : { r: 0, g: 0, b: 0 },
                  opacity:
                    existingPaint.opacity !== undefined
                      ? existingPaint.opacity
                      : 1,
                  visible: existingPaint.visible !== false,
                };
                fillsCopy[index] = figma.variables.setBoundVariableForPaint(
                  normalizedPaint,
                  "color",
                  variable
                );
                if (DEBUG)
                  console.log(
                    `[applyPropertiesToNode] Bound variable ${variableId} to fills[${index}] color`
                  );
              }
            }
          }
          paintNode.fills = fillsCopy;
        }
      } catch (e) {
        console.error("[applyPropertiesToNode] Error setting fills:", e);
      }
    }
    if (properties.strokes !== undefined) {
      try {
        // Support variable references in strokes
        const strokes = properties.strokes.map((stroke: any) => {
          if (stroke.type === "VARIABLE" && stroke.variableId) {
            // Variable paint is already in the correct format
            return stroke;
          }
          return stroke;
        });
        paintNode.strokes = strokes as Paint[];
      } catch (e) {
        console.error("Error setting strokes:", e);
      }
    }
    if (properties.strokeWeight !== undefined)
      paintNode.strokeWeight = properties.strokeWeight;
    if (properties.strokeAlign !== undefined)
      paintNode.strokeAlign = properties.strokeAlign;
    if (properties.strokeCap !== undefined && "strokeCap" in paintNode) {
      (paintNode as any).strokeCap = properties.strokeCap;
    }
    if (properties.strokeJoin !== undefined && "strokeJoin" in paintNode) {
      (paintNode as any).strokeJoin = properties.strokeJoin;
    }
  }

  // Corner radius
  if ("cornerRadius" in node) {
    const cornerNode = node as CornerMixin;
    if (properties.cornerRadius !== undefined)
      cornerNode.cornerRadius = properties.cornerRadius;
    // Individual corner radius properties are not available in the API
    // Only cornerRadius is supported
  }

  // Effects
  if ("effects" in node) {
    if (properties.effects !== undefined) {
      try {
        (node as any).effects = properties.effects as Effect[];
      } catch (e) {
        console.error("Error setting effects:", e);
      }
    }
  }

  // Text node specific properties
  if (node.type === "TEXT") {
    const textNode = node as TextNode;
    if (properties.characters !== undefined) {
      textNode.characters = properties.characters;
    }
    if (properties.fontSize !== undefined)
      textNode.fontSize = properties.fontSize;
    if (properties.fontName !== undefined) {
      const fontName = properties.fontName;
      if (
        typeof fontName === "object" &&
        "family" in fontName &&
        "style" in fontName
      ) {
        textNode.fontName = { family: fontName.family, style: fontName.style };
      }
    } else if (properties.fontWeight !== undefined) {
      // If only fontWeight is specified, use current font family
      const currentFont = textNode.fontName;
      if (typeof currentFont === "object" && "family" in currentFont) {
        textNode.fontName = {
          family: currentFont.family,
          style: properties.fontWeight,
        };
      }
    }
    if (properties.letterSpacing !== undefined)
      textNode.letterSpacing = properties.letterSpacing;
    if (properties.lineHeight !== undefined) {
      if (typeof properties.lineHeight === "object") {
        textNode.lineHeight = properties.lineHeight;
      } else {
        textNode.lineHeight = { value: properties.lineHeight, unit: "PIXELS" };
      }
    }
    if (properties.textAlignHorizontal !== undefined)
      textNode.textAlignHorizontal = properties.textAlignHorizontal;
    if (properties.textAlignVertical !== undefined)
      textNode.textAlignVertical = properties.textAlignVertical;
    if (properties.textCase !== undefined)
      textNode.textCase = properties.textCase;
    if (properties.textDecoration !== undefined)
      textNode.textDecoration = properties.textDecoration;
    if (properties.paragraphIndent !== undefined)
      textNode.paragraphIndent = properties.paragraphIndent;
    if (properties.paragraphSpacing !== undefined)
      textNode.paragraphSpacing = properties.paragraphSpacing;
    if (properties.textAutoResize !== undefined)
      textNode.textAutoResize = properties.textAutoResize;
  }

  // Frame node specific properties
  if (node.type === "FRAME") {
    const frameNode = node as FrameNode;
    if (properties.layoutMode !== undefined)
      frameNode.layoutMode = properties.layoutMode;
    if (properties.primaryAxisSizingMode !== undefined)
      frameNode.primaryAxisSizingMode = properties.primaryAxisSizingMode;
    if (properties.counterAxisSizingMode !== undefined)
      frameNode.counterAxisSizingMode = properties.counterAxisSizingMode;
    if (properties.paddingLeft !== undefined)
      frameNode.paddingLeft = properties.paddingLeft;
    if (properties.paddingRight !== undefined)
      frameNode.paddingRight = properties.paddingRight;
    if (properties.paddingTop !== undefined)
      frameNode.paddingTop = properties.paddingTop;
    if (properties.paddingBottom !== undefined)
      frameNode.paddingBottom = properties.paddingBottom;
    if (properties.itemSpacing !== undefined)
      frameNode.itemSpacing = properties.itemSpacing;
  }

  // Ellipse node specific properties
  if (node.type === "ELLIPSE") {
    const ellipseNode = node as EllipseNode;
    if (properties.arcData !== undefined)
      ellipseNode.arcData = properties.arcData;
  }

  // Line node specific properties
  if (node.type === "LINE") {
    const lineNode = node as LineNode;
    // strokeCap is already handled above
  }

  // Vector node specific properties
  if (node.type === "VECTOR") {
    const vectorNode = node as VectorNode;
    if (properties.vectorNetwork !== undefined)
      vectorNode.vectorNetwork = properties.vectorNetwork;
  }

  // Component node specific properties
  if (node.type === "COMPONENT") {
    const componentNode = node as ComponentNode;
    if (properties.description !== undefined)
      componentNode.description = properties.description;
  }
}

// Get all variables from the file
async function getVariables() {
  try {
    const variables = figma.variables.getLocalVariables();
    const collections = figma.variables.getLocalVariableCollections();

    const result = {
      variables: variables.map((v) => ({
        id: v.id,
        name: v.name,
        type: v.resolvedType,
        valuesByMode: v.valuesByMode,
        scopes: v.scopes,
        description: v.description || "",
        hiddenFromPublishing: v.hiddenFromPublishing,
      })),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        modes: c.modes,
        variableIds: c.variableIds,
      })),
    };

    logToUI(
      `Retrieved ${variables.length} variables and ${collections.length} collections`
    );
    figma.notify(`Retrieved ${variables.length} variables`);

    // Send variables back to server (could be enhanced to return via API)
    if (DEBUG) console.log("Variables:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error getting variables:", error);
    logToUI(
      `Error getting variables: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error"
    );
    figma.notify("Error getting variables", { error: true });
  }
}

// Create a new variable
async function createVariable(data: {
  name: string;
  variableType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, any>;
  collectionId?: string;
  description?: string;
  scopes?: Array<
    | "ALL_SCOPES"
    | "TEXT_CONTENT"
    | "CORNER_RADIUS"
    | "WIDTH_HEIGHT"
    | "GAP"
    | "ALL_FILLS"
    | "FRAME_FILL"
    | "SHAPE_FILL"
    | "TEXT_FILL"
    | "STROKE_FLOAT"
    | "EFFECT_FLOAT"
    | "EFFECT_COLOR"
    | "OPACITY"
    | "FONT_STYLE"
    | "FONT_FAMILY"
    | "FONT_SIZE"
    | "LINE_HEIGHT"
    | "LETTER_SPACING"
    | "PARAGRAPH_SPACING"
    | "PARAGRAPH_INDENT"
    | "TRANSFORM"
    | "STROKE_COLOR"
    | "FONT_WEIGHT"
  >;
}) {
  try {
    const {
      name,
      variableType,
      valuesByMode,
      collectionId,
      description,
      scopes,
    } = data;

    // Get or create collection
    let collection: VariableCollection;
    if (collectionId) {
      const collections = figma.variables.getLocalVariableCollections();
      const foundCollection = collections.find((c) => c.id === collectionId);
      if (!foundCollection) {
        throw new Error(`Collection with id ${collectionId} not found`);
      }
      collection = foundCollection;
    } else {
      // Use existing collection or create default
      const collections = figma.variables.getLocalVariableCollections();
      collection =
        collections.length > 0
          ? collections[0]
          : figma.variables.createVariableCollection("Default");
      if (!collection) {
        throw new Error("Failed to create or find variable collection");
      }
    }

    // Get first mode ID for variable creation
    const firstModeId = collection.modes[0]?.modeId;
    if (!firstModeId) {
      throw new Error("Collection must have at least one mode");
    }

    // Get first value for initial creation
    const firstValue = valuesByMode[firstModeId];
    if (firstValue === undefined) {
      // Try to get any value from valuesByMode
      const modeIds = Object.keys(valuesByMode);
      if (modeIds.length === 0) {
        throw new Error("At least one value must be provided");
      }
      const anyValue = valuesByMode[modeIds[0]];
      if (anyValue === undefined) {
        throw new Error("At least one value must be provided");
      }
    }

    // Create variable with first mode value
    const variable = figma.variables.createVariable(
      name,
      collection,
      variableType
    );

    // Set values for all modes
    const modeEntries = Object.keys(valuesByMode).map(
      (key) => [key, valuesByMode[key]] as [string, any]
    );
    for (const [modeId, value] of modeEntries) {
      // Verify mode exists in collection
      const modeExists = collection.modes.some((m) => m.modeId === modeId);
      if (modeExists) {
        variable.setValueForMode(modeId, value);
      } else {
        console.warn(`Mode ${modeId} not found in collection, skipping`);
      }
    }

    // Set description
    if (description) {
      variable.description = description;
    }

    // Set scopes
    if (scopes && scopes.length > 0) {
      variable.scopes = scopes as any;
    }

    logToUI(`Created variable: ${name}`);
    figma.notify(`Created variable: ${name}`);
  } catch (error) {
    console.error("Error creating variable:", error);
    logToUI(
      `Error creating variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error"
    );
    figma.notify("Error creating variable", { error: true });
  }
}

// Update an existing variable
async function updateVariable(data: {
  variableId: string;
  name?: string;
  valuesByMode?: Record<string, any>;
  description?: string;
  scopes?: Array<
    | "ALL_SCOPES"
    | "TEXT_CONTENT"
    | "CORNER_RADIUS"
    | "WIDTH_HEIGHT"
    | "GAP"
    | "ALL_FILLS"
    | "FRAME_FILL"
    | "SHAPE_FILL"
    | "TEXT_FILL"
    | "STROKE_FLOAT"
    | "EFFECT_FLOAT"
    | "EFFECT_COLOR"
    | "OPACITY"
    | "FONT_STYLE"
    | "FONT_FAMILY"
    | "FONT_SIZE"
    | "LINE_HEIGHT"
    | "LETTER_SPACING"
    | "PARAGRAPH_SPACING"
    | "PARAGRAPH_INDENT"
    | "TRANSFORM"
    | "STROKE_COLOR"
    | "FONT_WEIGHT"
  >;
}) {
  try {
    const { variableId, name, valuesByMode, description, scopes } = data;

    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) {
      throw new Error(`Variable with id ${variableId} not found`);
    }

    // Update name
    if (name !== undefined) {
      variable.name = name;
    }

    // Update values by mode
    if (valuesByMode) {
      const modeEntries = Object.keys(valuesByMode).map(
        (key) => [key, valuesByMode[key]] as [string, any]
      );
      for (const [modeId, value] of modeEntries) {
        variable.setValueForMode(modeId, value);
      }
    }

    // Update description
    if (description !== undefined) {
      variable.description = description;
    }

    // Update scopes
    if (scopes !== undefined) {
      variable.scopes = scopes as any;
    }

    logToUI(`Updated variable: ${variable.name}`);
    figma.notify(`Updated variable: ${variable.name}`);
  } catch (error) {
    console.error("Error updating variable:", error);
    logToUI(
      `Error updating variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error"
    );
    figma.notify("Error updating variable", { error: true });
  }
}

// Delete a variable
async function deleteVariable(data: { variableId: string }) {
  try {
    const { variableId } = data;

    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) {
      throw new Error(`Variable with id ${variableId} not found`);
    }

    const variableName = variable.name;
    variable.remove();

    logToUI(`Deleted variable: ${variableName}`);
    figma.notify(`Deleted variable: ${variableName}`);
  } catch (error) {
    console.error("Error deleting variable:", error);
    logToUI(
      `Error deleting variable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error"
    );
    figma.notify("Error deleting variable", { error: true });
  }
}

// Handle messages from UI
if (DEBUG) console.log("[code.ts] Setting up message handler");
logToUI("[code.ts] Setting up message handler");

figma.ui.onmessage = async (msg) => {
  if (DEBUG)
    console.log(
      "[code.ts] Received message from UI:",
      JSON.stringify(msg, null, 2)
    );
  logToUI("[code.ts] Received message from UI: " + JSON.stringify(msg));

  if (msg.type === "register") {
    if (DEBUG) console.log("[code.ts] Handling register message");
    logToUI("[code.ts] Handling register message");
    healthcheckWithServer();
  } else if (msg.type === "cancel") {
    if (DEBUG) console.log("[code.ts] Handling cancel message");
    logToUI("[code.ts] Handling cancel message");
    // Ask UI to close WebSocket connection
    figma.ui.postMessage({ type: "disconnect-websocket" });
    figma.closePlugin();
  } else if (msg.type === "websocket-update") {
    // Handle updates received via WebSocket from UI
    if (DEBUG)
      console.log(
        "[code.ts] Received websocket-update message:",
        JSON.stringify(msg, null, 2)
      );
    logToUI(
      "[code.ts] Received websocket-update message: " + JSON.stringify(msg)
    );

    try {
      if (DEBUG)
        console.log(
          "[code.ts] Calling applyUpdates with:",
          JSON.stringify(msg.updates, null, 2)
        );
      logToUI(
        "[code.ts] Calling applyUpdates with: " + JSON.stringify(msg.updates)
      );
      await applyUpdates(msg.updates);
      if (DEBUG) console.log("[code.ts] applyUpdates completed successfully");
      logToUI("[code.ts] applyUpdates completed successfully");
    } catch (error) {
      console.error("[code.ts] Error applying updates:", error);
      logToUI(
        "Error occurred while applying updates: " +
          (error instanceof Error ? error.message : String(error)),
        "error"
      );
    }
  } else {
    if (DEBUG) console.log("[code.ts] Unknown message type:", msg.type);
    logToUI("[code.ts] Unknown message type: " + msg.type);
  }
};
