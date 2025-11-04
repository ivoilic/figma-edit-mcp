import { healthcheckWithServer, stopPolling } from "./api/server";
import { logToUI } from "./utils/logger";
import { applyUpdates } from "./updates/processor";

// Initialize plugin
figma.showUI(__html__, { width: 300, height: 400 });

// Track font loading status
let fontsLoaded = false;

// Preload commonly used fonts
Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
])
  .then(() => {
    logToUI("Fonts loaded successfully");
    fontsLoaded = true;
    // Connect to server after fonts are loaded
    const pluginId =
      figma.root.getPluginData("pluginId") || `plugin-${Date.now()}`;
    const fileId = figma.fileKey || `local-file-${Date.now()}`;
    figma.root.setPluginData("pluginId", pluginId);
    healthcheckWithServer(pluginId, fileId);
  })
  .catch((error) => {
    console.error("Error preloading fonts:", error);
    logToUI("Failed to load fonts, but attempting to connect anyway", "error");
    // Attempt to connect even if error occurs
    const pluginId =
      figma.root.getPluginData("pluginId") || `plugin-${Date.now()}`;
    const fileId = figma.fileKey || `local-file-${Date.now()}`;
    figma.root.setPluginData("pluginId", pluginId);
    healthcheckWithServer(pluginId, fileId);
  });

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "register") {
    const pluginId =
      figma.root.getPluginData("pluginId") || `plugin-${Date.now()}`;
    const fileId = figma.fileKey || `local-file-${Date.now()}`;
    figma.root.setPluginData("pluginId", pluginId);
    healthcheckWithServer(pluginId, fileId);
  } else if (msg.type === "cancel") {
    stopPolling();
    figma.closePlugin();
  } else if (msg.type === "websocket-update") {
    try {
      await applyUpdates(msg.updates);
    } catch (error) {
      logToUI(
        "Error applying updates: " +
          (error instanceof Error ? error.message : String(error)),
        "error"
      );
    }
  }
};
