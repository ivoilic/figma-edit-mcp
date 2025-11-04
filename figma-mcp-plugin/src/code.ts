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
console.log("[code.ts] Plugin initializing...");
figma.showUI(__html__, { width: 300, height: 400 });
console.log("[code.ts] UI shown");

// Track font loading status
let fontsLoaded = false;

// Preload commonly used fonts
Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
])
  .then(() => {
    console.log("[code.ts] Fonts loaded successfully");
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
      fileId 
    });
  } catch (error: unknown) {
    console.error("Failed to register with MCP server:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Failed to register with MCP server: ${errorMessage}`, "error");
    figma.ui.postMessage({ type: "connection-error", error: errorMessage });
  }
}

// Figmaデザインに更新を適用
async function applyUpdates(updates: any) {
  try {
    console.log("[applyUpdates] Received updates:", JSON.stringify(updates, null, 2));
    logToUI("[applyUpdates] Received updates: " + JSON.stringify(updates));
    
    // 更新の処理
    if (updates && updates.updates && Array.isArray(updates.updates)) {
      // MCPサーバーから送られてくる形式（updates.updatesの形式）
      console.log(`[applyUpdates] Processing ${updates.updates.length} updates`);
      logToUI(`[applyUpdates] Processing ${updates.updates.length} updates`);
      
      // 各更新を処理
      for (const update of updates.updates) {
        const { type, data } = update;
        if (!type) continue;

        console.log(`[applyUpdates] Processing update type: ${type}`);
        logToUI(`[applyUpdates] Processing update type: ${type}`);
        
        if (type === "updateNode") {
          console.log(`[applyUpdates] updateNode data:`, JSON.stringify(data, null, 2));
          logToUI(`[applyUpdates] updateNode data: ${JSON.stringify(data)}`);
          
          if (data.properties && data.properties.fills) {
            console.log(`[applyUpdates] Fills in updateNode:`, JSON.stringify(data.properties.fills, null, 2));
            logToUI(`[applyUpdates] Fills in updateNode: ${JSON.stringify(data.properties.fills)}`);
          }
        }

        // 新しい低レベル操作を処理
        if (type === "createNode") {
          await createNode(data);
        } else if (type === "updateNode") {
          await updateNode(data);
        } else if (type === "deleteNode") {
          await deleteNode(data);
        } else {
          // 旧形式の更新（互換性のため）
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else if (Array.isArray(updates)) {
      // 配列形式の場合（互換性のため）
      // 各更新を処理
      for (const update of updates) {
        const { type, data } = update;
        if (!type) continue;

        // 新しい低レベル操作を処理
        if (type === "createNode") {
          await createNode(data);
        } else if (type === "updateNode") {
          await updateNode(data);
        } else if (type === "deleteNode") {
          await deleteNode(data);
        } else {
          // 旧形式の更新（互換性のため）
          if (data) {
            const tempUpdates = { [type]: data };
            await processUpdates(tempUpdates);
          }
        }
      }
    } else {
      // 旧形式の更新（互換性のため）
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

    // 位置の設定
    if (x !== undefined) frame.x = x;
    if (y !== undefined) frame.y = y;

    // 塗りつぶしの設定
    if (fills && Array.isArray(fills)) {
      try {
        frame.fills = fills as Paint[];
      } catch (e) {
        console.error("Error setting fills:", e);
      }
    }

    // 角丸の設定
    if (cornerRadius !== undefined) frame.cornerRadius = cornerRadius;

    // レイアウトモードの設定
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

    // ストロークの設定
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

    // 透明度の設定
    if (opacity !== undefined) frame.opacity = opacity;

    // エフェクトの設定
    if (effects && Array.isArray(effects)) {
      try {
        frame.effects = effects as Effect[];
      } catch (e) {
        console.error("Error setting effects:", e);
      }
    }

    // 表示/非表示の設定
    if (visible !== undefined) frame.visible = visible;

    // 現在のページに追加
    figma.currentPage.appendChild(frame);

    // ビューポートを新しいフレームに移動
    figma.viewport.scrollAndZoomIntoView([frame]);
  }

  // テキスト要素の作成
  if (updates.createText) {
    if (Array.isArray(updates.createText)) {
      // 配列の場合は各要素を処理
      await Promise.all(
        updates.createText.map((textData: any, index: number) =>
          createTextElement(textData, index)
        )
      );
    } else {
      // 単一のオブジェクトの場合
      await createTextElement(updates.createText);
    }
  }

  // 矩形の作成
  if (updates.createRectangle) {
    if (Array.isArray(updates.createRectangle)) {
      // 配列の場合は各要素を処理
      await Promise.all(
        updates.createRectangle.map((rectData: any, index: number) =>
          createRectangleElement(rectData, index)
        )
      );
    } else {
      // 単一のオブジェクトの場合
      await createRectangleElement(updates.createRectangle);
    }
  }

  // 楕円の作成
  if (updates.createEllipse) {
    if (Array.isArray(updates.createEllipse)) {
      // 配列の場合は各要素を処理
      await Promise.all(
        updates.createEllipse.map((ellipseData: any, index: number) =>
          createEllipseElement(ellipseData, index)
        )
      );
    } else {
      // 単一のオブジェクトの場合
      await createEllipseElement(updates.createEllipse);
    }
  }

  // 線の作成
  if (updates.createLine) {
    if (Array.isArray(updates.createLine)) {
      // 配列の場合は各要素を処理
      updates.createLine.forEach((lineData: any, index: number) => {
        createLineElement(lineData, index);
      });
    } else {
      // 単一のオブジェクトの場合
      createLineElement(updates.createLine);
    }
  }

  // 画像の挿入
  if (updates.createImage) {
    if (Array.isArray(updates.createImage)) {
      // 配列の場合は各要素を処理
      updates.createImage.forEach((imageData: any, index: number) => {
        createImageElement(imageData, index);
      });
    } else {
      // 単一のオブジェクトの場合
      createImageElement(updates.createImage);
    }
  }

  // コンポーネントの作成
  if (updates.createComponent) {
    if (Array.isArray(updates.createComponent)) {
      // 配列の場合は各要素を処理
      updates.createComponent.forEach((componentData: any, index: number) => {
        createComponentElement(componentData, index);
      });
    } else {
      // 単一のオブジェクトの場合
      createComponentElement(updates.createComponent);
    }
  }
}

// テキスト要素を作成する関数
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
      // charactersパラメータがない場合はエラーを返す
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

      // 位置の設定
      if (x !== undefined) text.x = x;
      if (y !== undefined) text.y = y;

      // フォントの読み込みを待機（awaitを使用して同期的に処理）
      const fontStyle = fontWeight === "Bold" ? "Bold" : "Regular";

      try {
        // 常にフォントを読み込む（キャッシュされていれば高速に完了する）
        await figma.loadFontAsync({ family: "Inter", style: fontStyle });

        // フォントが読み込まれた後にテキストを設定
        text.characters = characters;
        if (fontSize) text.fontSize = fontSize;
        if (fontWeight === "Bold")
          text.fontName = { family: "Inter", style: "Bold" };

        // テキストの自動リサイズモードを設定
        if (textAutoResize) {
          text.textAutoResize = textAutoResize;
        } else {
          // デフォルトでは幅固定で高さ自動調整
          text.textAutoResize = "HEIGHT";
        }

        // 幅が指定されている場合は設定
        if (width) {
          text.resize(width, text.height);
        } else if (characters.length > 20) {
          // 長いテキストの場合はデフォルトの幅を設定
          text.resize(300, text.height);
        }

        // 段落間隔の設定
        if (paragraphSpacing !== undefined) {
          text.paragraphSpacing = paragraphSpacing;
        }

        // 行の高さの設定
        if (lineHeight) {
          text.lineHeight = lineHeight;
        }

        // 塗りつぶしの設定
        if (fills && Array.isArray(fills)) {
          try {
            const solidFills = fills as SolidPaint[];
            text.fills = solidFills;
          } catch (e) {
            console.error("Error setting text fills:", e);
          }
        }

        // 現在のページに追加
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

// 矩形を作成する関数
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

      // ストロークの設定
      if (strokes && Array.isArray(strokes)) {
        try {
          rect.strokes = strokes as Paint[];
        } catch (e) {
          console.error("Error setting strokes:", e);
        }
      }

      if (strokeWeight !== undefined) rect.strokeWeight = strokeWeight;
      if (strokeAlign) rect.strokeAlign = strokeAlign;

      // 角丸の設定
      if (cornerRadius !== undefined) {
        rect.cornerRadius = cornerRadius;
      } else {
        // 個別の角丸を設定
        if (topLeftRadius !== undefined) rect.topLeftRadius = topLeftRadius;
        if (topRightRadius !== undefined) rect.topRightRadius = topRightRadius;
        if (bottomLeftRadius !== undefined)
          rect.bottomLeftRadius = bottomLeftRadius;
        if (bottomRightRadius !== undefined)
          rect.bottomRightRadius = bottomRightRadius;
      }

      // 透明度の設定
      if (opacity !== undefined) rect.opacity = opacity;

      // エフェクトの設定
      if (effects && Array.isArray(effects)) {
        try {
          rect.effects = effects as Effect[];
        } catch (e) {
          console.error("Error setting effects:", e);
        }
      }

      // 表示/非表示の設定
      if (visible !== undefined) rect.visible = visible;

      // 現在のページに追加
      figma.currentPage.appendChild(rect);

      resolve(rect);
    } catch (error) {
      console.error("Error creating rectangle:", error);
      reject(error);
    }
  });
}

// 楕円を作成する関数
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

      // ストロークの設定
      if (strokes && Array.isArray(strokes)) {
        try {
          ellipse.strokes = strokes as Paint[];
        } catch (e) {
          console.error("Error setting strokes:", e);
        }
      }

      if (strokeWeight !== undefined) ellipse.strokeWeight = strokeWeight;
      if (strokeAlign) ellipse.strokeAlign = strokeAlign;

      // 弧データの設定
      if (arcData) {
        ellipse.arcData = arcData;
      }

      // 透明度の設定
      if (opacity !== undefined) ellipse.opacity = opacity;

      // エフェクトの設定
      if (effects && Array.isArray(effects)) {
        try {
          ellipse.effects = effects as Effect[];
        } catch (e) {
          console.error("Error setting effects:", e);
        }
      }

      // 表示/非表示の設定
      if (visible !== undefined) ellipse.visible = visible;

      // 現在のページに追加
      figma.currentPage.appendChild(ellipse);

      resolve(ellipse);
    } catch (error) {
      console.error("Error creating ellipse:", error);
      reject(error);
    }
  });
}

// 線を作成する関数
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

  // 線の始点と終点
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  // 線を作成（実際にはベクターネットワークを使用）
  const line = figma.createLine();
  line.name = name || `Line ${index !== undefined ? index + 1 : ""}`;

  // 始点と終点を設定
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
    // デフォルトのストローク
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

// 画像の挿入
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

  // 画像を挿入するためのRectangleを作成
  const rect = figma.createRectangle();
  rect.name = name || `Image ${index !== undefined ? index + 1 : ""}`;
  rect.resize(width || 100, height || 100);

  // 位置の設定
  if (x !== undefined) rect.x = x;
  if (y !== undefined) rect.y = y;

  // 画像URLからFigmaで使用できる画像を取得（非同期処理）
  figma
    .createImageAsync(imageUrl)
    .then((image) => {
      // 画像を塗りつぶしとして設定
      const imageFill: ImagePaint = {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: scaleMode || "FILL",
      };

      rect.fills = [imageFill];

      // 透明度の設定
      if (opacity !== undefined) rect.opacity = opacity;

      // エフェクトの設定
      if (effects && Array.isArray(effects)) {
        try {
          rect.effects = effects as Effect[];
        } catch (e) {
          console.error("Error setting effects:", e);
        }
      }

      // 表示/非表示の設定
      if (visible !== undefined) rect.visible = visible;
    })
    .catch((error) => {
      console.error("Error creating image:", error);
      // エラー時は赤い矩形を表示
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
}

// Low-level: Update node properties
async function updateNode(data: {
  nodeId: string;
  properties?: Record<string, any>;
  parentId?: string;
  index?: number;
}) {
  const { nodeId, properties, parentId, index } = data;

  console.log(`[updateNode] Starting update for node ${nodeId}`);
  logToUI(`[updateNode] Starting update for node ${nodeId}`);

  const node = findNodeById(nodeId);
  if (!node) {
    const error = `Node with id ${nodeId} not found`;
    console.error(`[updateNode] ${error}`);
    logToUI(`[updateNode] ${error}`, "error");
    throw new Error(error);
  }

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
    console.log(`[updateNode] Properties received:`, JSON.stringify(properties, null, 2));
    logToUI(`[updateNode] Properties received: ${JSON.stringify(properties)}`);
    
    if (properties.fills) {
      console.log(`[updateNode] Fills in properties:`, JSON.stringify(properties.fills, null, 2));
      logToUI(`[updateNode] Fills in properties: ${JSON.stringify(properties.fills)}`);
    }
    
    applyPropertiesToNode(node, properties);
    
    // Log what was actually set
    if ("fills" in node) {
      const paintNode = node as GeometryMixin;
      console.log(`[updateNode] Fills after applying:`, JSON.stringify(paintNode.fills, null, 2));
      logToUI(`[updateNode] Fills after applying: ${JSON.stringify(paintNode.fills)}`);
    }
  } else {
    console.log(`[updateNode] No properties to update`);
    logToUI(`[updateNode] No properties to update`);
  }
  
  console.log(`[updateNode] Update complete for node ${nodeId}`);
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
function applyPropertiesToNode(
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

  // Fills and strokes (support variables)
  if ("fills" in node) {
    const paintNode = node as GeometryMixin;
    if (properties.fills !== undefined) {
      try {
        console.log('[applyPropertiesToNode] Processing fills, input:', JSON.stringify(properties.fills, null, 2));
        
        // Support variable references in fills and normalize opacity
        const fills = properties.fills.map((fill: any, index: number) => {
          console.log(`[applyPropertiesToNode] Processing fill ${index}:`, JSON.stringify(fill, null, 2));
          
          if (fill.type === "VARIABLE" && fill.variableId) {
            // Variable paint is already in the correct format
            console.log(`[applyPropertiesToNode] Fill ${index} is VARIABLE type, returning as-is`);
            return fill;
          }
          // For SOLID paints, ensure opacity is properly set
          if (fill.type === "SOLID") {
            console.log(`[applyPropertiesToNode] Fill ${index} is SOLID type, normalizing...`);
            console.log(`[applyPropertiesToNode] Fill ${index} - opacity in input:`, fill.opacity);
            console.log(`[applyPropertiesToNode] Fill ${index} - color.a in input:`, fill.color?.a);
            
            // Create a new fill object with opacity preserved
            const normalizedFill: any = {
              type: "SOLID",
            };
            
            // Handle color - remove 'a' if opacity is specified separately
            if (fill.color) {
              const color = { ...fill.color };
              // If opacity is specified on the fill, remove 'a' from color to avoid conflicts
              if (fill.opacity !== undefined && "a" in color) {
                console.log(`[applyPropertiesToNode] Fill ${index} - Removing color.a (${color.a}) because opacity (${fill.opacity}) is specified`);
                delete color.a;
              }
              normalizedFill.color = color;
              console.log(`[applyPropertiesToNode] Fill ${index} - Normalized color:`, JSON.stringify(color));
            } else {
              normalizedFill.color = { r: 0, g: 0, b: 0 };
            }
            
            // Set opacity if provided
            if (fill.opacity !== undefined) {
              normalizedFill.opacity = fill.opacity;
              console.log(`[applyPropertiesToNode] Fill ${index} - Set opacity to:`, fill.opacity);
            }
            
            // Preserve other properties
            if (fill.blendMode !== undefined) normalizedFill.blendMode = fill.blendMode;
            if (fill.visible !== undefined) normalizedFill.visible = fill.visible;
            
            console.log(`[applyPropertiesToNode] Fill ${index} normalized result:`, JSON.stringify(normalizedFill, null, 2));
            return normalizedFill;
          }
          console.log(`[applyPropertiesToNode] Fill ${index} is not SOLID or VARIABLE, returning as-is`);
          return fill;
        });
        
        console.log('[applyPropertiesToNode] All normalized fills:', JSON.stringify(fills, null, 2));
        paintNode.fills = fills as Paint[];
        console.log('[applyPropertiesToNode] Fills set on node. Verifying what was actually set...');
        console.log('[applyPropertiesToNode] Node fills after assignment:', JSON.stringify(paintNode.fills, null, 2));
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
    console.log("Variables:", JSON.stringify(result, null, 2));
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
    | "TEXT_COLOR"
    | "BG_COLOR"
    | "FILL_COLOR"
    | "STROKE_COLOR"
    | "EFFECT_COLOR"
    | "OPACITY"
    | "FONT_FAMILY"
    | "FONT_SIZE"
    | "FONT_WEIGHT"
    | "LINE_HEIGHT"
    | "LETTER_SPACING"
    | "PARAGRAPH_SPACING"
    | "PARAGRAPH_INDENT"
    | "BORDER_RADIUS"
    | "SPACING"
    | "DIMENSION"
    | "GAP"
    | "SIZING_WIDTH"
    | "SIZING_HEIGHT"
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
    | "TEXT_COLOR"
    | "BG_COLOR"
    | "FILL_COLOR"
    | "STROKE_COLOR"
    | "EFFECT_COLOR"
    | "OPACITY"
    | "FONT_FAMILY"
    | "FONT_SIZE"
    | "FONT_WEIGHT"
    | "LINE_HEIGHT"
    | "LETTER_SPACING"
    | "PARAGRAPH_SPACING"
    | "PARAGRAPH_INDENT"
    | "BORDER_RADIUS"
    | "SPACING"
    | "DIMENSION"
    | "GAP"
    | "SIZING_WIDTH"
    | "SIZING_HEIGHT"
  >;
}) {
  try {
    const { variableId, name, valuesByMode, description, scopes } = data;

    const variable = figma.variables.getVariableById(variableId);
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

    const variable = figma.variables.getVariableById(variableId);
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
console.log("[code.ts] Setting up message handler");
logToUI("[code.ts] Setting up message handler");

figma.ui.onmessage = async (msg) => {
  console.log("[code.ts] Received message from UI:", JSON.stringify(msg, null, 2));
  logToUI("[code.ts] Received message from UI: " + JSON.stringify(msg));
  
  if (msg.type === "register") {
    console.log("[code.ts] Handling register message");
    logToUI("[code.ts] Handling register message");
    healthcheckWithServer();
  } else if (msg.type === "cancel") {
    console.log("[code.ts] Handling cancel message");
    logToUI("[code.ts] Handling cancel message");
    // Ask UI to close WebSocket connection
    figma.ui.postMessage({ type: "disconnect-websocket" });
    figma.closePlugin();
  } else if (msg.type === "websocket-update") {
    // Handle updates received via WebSocket from UI
    console.log("[code.ts] Received websocket-update message:", JSON.stringify(msg, null, 2));
    logToUI("[code.ts] Received websocket-update message: " + JSON.stringify(msg));
    
    try {
      console.log("[code.ts] Calling applyUpdates with:", JSON.stringify(msg.updates, null, 2));
      logToUI("[code.ts] Calling applyUpdates with: " + JSON.stringify(msg.updates));
      await applyUpdates(msg.updates);
      console.log("[code.ts] applyUpdates completed successfully");
      logToUI("[code.ts] applyUpdates completed successfully");
    } catch (error) {
      console.error("[code.ts] Error applying updates:", error);
      logToUI("Error occurred while applying updates: " + (error instanceof Error ? error.message : String(error)), "error");
    }
  } else {
    console.log("[code.ts] Unknown message type:", msg.type);
    logToUI("[code.ts] Unknown message type: " + msg.type);
  }
};
