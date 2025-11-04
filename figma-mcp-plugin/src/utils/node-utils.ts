// Search for node by ID (recursive, search all pages)
export function findNodeById(nodeId: string): SceneNode | null {
  function search(node: BaseNode): SceneNode | null {
    // Directly compare node IDs (supports both Figma REST API ID format and plugin API ID format)
    if (node.id === nodeId && 'type' in node) {
      return node as SceneNode;
    }

    // Search nodes with children
    if ('children' in node) {
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
export function applyPropertiesToNode(
  node: SceneNode,
  properties: Record<string, any>
) {
  // Basic properties
  if (properties.name !== undefined) node.name = properties.name;
  if (properties.x !== undefined) node.x = properties.x;
  if (properties.y !== undefined) node.y = properties.y;
  if (properties.opacity !== undefined && 'opacity' in node) {
    (node as any).opacity = properties.opacity;
  }
  if (properties.visible !== undefined) node.visible = properties.visible;
  if (properties.blendMode !== undefined && 'blendMode' in node) {
    (node as any).blendMode = properties.blendMode;
  }

  // Layout-capable nodes
  if ('resize' in node) {
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
  if ('fills' in node) {
    const paintNode = node as GeometryMixin;
    if (properties.fills !== undefined) {
      try {
        // Support variable references in fills and normalize opacity
        const fills = properties.fills.map((fill: any) => {
          if (fill.type === 'VARIABLE' && fill.variableId) {
            // Variable paint is already in the correct format
            return fill;
          }
          // For SOLID paints, ensure opacity is properly set
          if (fill.type === 'SOLID') {
            // Create a new fill object with opacity preserved
            const normalizedFill: any = {
              type: 'SOLID',
            };
            
            // Handle color - remove 'a' if opacity is specified separately
            if (fill.color) {
              const color = { ...fill.color };
              // If opacity is specified on the fill, remove 'a' from color to avoid conflicts
              if (fill.opacity !== undefined && 'a' in color) {
                delete color.a;
              }
              normalizedFill.color = color;
            } else {
              normalizedFill.color = { r: 0, g: 0, b: 0 };
            }
            
            // Set opacity if provided
            if (fill.opacity !== undefined) {
              normalizedFill.opacity = fill.opacity;
            }
            
            // Preserve other properties
            if (fill.blendMode !== undefined) normalizedFill.blendMode = fill.blendMode;
            if (fill.visible !== undefined) normalizedFill.visible = fill.visible;
            
            return normalizedFill;
          }
          return fill;
        });
        
        paintNode.fills = fills as Paint[];
      } catch (e) {
        console.error('Error setting fills:', e);
      }
    }
    if (properties.strokes !== undefined) {
      try {
        // Support variable references in strokes and normalize opacity
        const strokes = properties.strokes.map((stroke: any) => {
          if (stroke.type === 'VARIABLE' && stroke.variableId) {
            // Variable paint is already in the correct format
            return stroke;
          }
          // For SOLID paints, ensure opacity is properly set
          if (stroke.type === 'SOLID') {
            // Create a new stroke object with opacity preserved
            const normalizedStroke: any = {
              type: 'SOLID',
            };
            
            // Handle color - remove 'a' if opacity is specified separately
            if (stroke.color) {
              const color = { ...stroke.color };
              // If opacity is specified on the stroke, remove 'a' from color to avoid conflicts
              if (stroke.opacity !== undefined && 'a' in color) {
                delete color.a;
              }
              normalizedStroke.color = color;
            } else {
              normalizedStroke.color = { r: 0, g: 0, b: 0 };
            }
            
            // Set opacity if provided
            if (stroke.opacity !== undefined) {
              normalizedStroke.opacity = stroke.opacity;
            }
            
            // Preserve other properties
            if (stroke.blendMode !== undefined) normalizedStroke.blendMode = stroke.blendMode;
            if (stroke.visible !== undefined) normalizedStroke.visible = stroke.visible;
            return normalizedStroke;
          }
          return stroke;
        });
        paintNode.strokes = strokes as Paint[];
      } catch (e) {
        console.error('Error setting strokes:', e);
      }
    }
    if (properties.strokeWeight !== undefined)
      paintNode.strokeWeight = properties.strokeWeight;
    if (properties.strokeAlign !== undefined)
      paintNode.strokeAlign = properties.strokeAlign;
    if (properties.strokeCap !== undefined && 'strokeCap' in paintNode) {
      (paintNode as any).strokeCap = properties.strokeCap;
    }
    if (properties.strokeJoin !== undefined && 'strokeJoin' in paintNode) {
      (paintNode as any).strokeJoin = properties.strokeJoin;
    }
  }

  // Corner radius
  if ('cornerRadius' in node) {
    const cornerNode = node as CornerMixin;
    if (properties.cornerRadius !== undefined)
      cornerNode.cornerRadius = properties.cornerRadius;
    // Individual corner radius properties are not available in the API
    // Only cornerRadius is supported
  }

  // Effects
  if ('effects' in node) {
    if (properties.effects !== undefined) {
      try {
        (node as any).effects = properties.effects as Effect[];
      } catch (e) {
        console.error('Error setting effects:', e);
      }
    }
  }

  // Text node specific properties
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    if (properties.characters !== undefined) {
      textNode.characters = properties.characters;
    }
    if (properties.fontSize !== undefined)
      textNode.fontSize = properties.fontSize;
    if (properties.fontName !== undefined) {
      const fontName = properties.fontName;
      if (
        typeof fontName === 'object' &&
        'family' in fontName &&
        'style' in fontName
      ) {
        textNode.fontName = { family: fontName.family, style: fontName.style };
      }
    } else if (properties.fontWeight !== undefined) {
      // If only fontWeight is specified, use current font family
      const currentFont = textNode.fontName;
      if (typeof currentFont === 'object' && 'family' in currentFont) {
        textNode.fontName = {
          family: currentFont.family,
          style: properties.fontWeight,
        };
      }
    }
    if (properties.letterSpacing !== undefined)
      textNode.letterSpacing = properties.letterSpacing;
    if (properties.lineHeight !== undefined) {
      if (typeof properties.lineHeight === 'object') {
        textNode.lineHeight = properties.lineHeight;
      } else {
        textNode.lineHeight = { value: properties.lineHeight, unit: 'PIXELS' };
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
  if (node.type === 'FRAME') {
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
  if (node.type === 'ELLIPSE') {
    const ellipseNode = node as EllipseNode;
    if (properties.arcData !== undefined)
      ellipseNode.arcData = properties.arcData;
  }

  // Line node specific properties
  if (node.type === 'LINE') {
    const lineNode = node as LineNode;
    // strokeCap is already handled above
  }

  // Vector node specific properties
  if (node.type === 'VECTOR') {
    const vectorNode = node as VectorNode;
    if (properties.vectorNetwork !== undefined)
      vectorNode.vectorNetwork = properties.vectorNetwork;
  }

  // Component node specific properties
  if (node.type === 'COMPONENT') {
    const componentNode = node as ComponentNode;
    if (properties.description !== undefined)
      componentNode.description = properties.description;
  }
}

