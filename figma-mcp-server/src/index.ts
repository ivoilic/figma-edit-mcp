#!/usr/bin/env node
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import type { Context } from "hono";
import type { ServerType } from "@hono/node-server";
import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { FIGMA_ACCESS_TOKEN, PORT } from "./config/index.js";
import { pluginRouter, setUpgradeWebSocket } from "./api/plugin-api.js";
import { FigmaServer } from "./mcp/figma-server.js";

// Check access token
if (!FIGMA_ACCESS_TOKEN) {
  console.error("FIGMA_ACCESS_TOKEN is required");
  process.exit(1);
}

// Server configuration for plugin communication
const app = new Hono();

// Create WebSocket support
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });

// Enable CORS (allow private network access)
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Access-Control-Allow-Private-Network"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Access-Control-Allow-Private-Network"],
  })
);

// Add header to allow private network access
app.use("*", async (c: Context, next) => {
  c.header("Access-Control-Allow-Private-Network", "true");
  await next();
});

// Set plugin API router
app.route("/plugin", pluginRouter);

// Export upgradeWebSocket for plugin router
setUpgradeWebSocket(upgradeWebSocket);

// Start MCP server
const mcpServer = new FigmaServer();

// Store server instance for graceful shutdown
let httpServer: ServerType | null = null;

// Function to check if port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => {
        // If error occurs, port is in use
        resolve(false);
      })
      .once("listening", () => {
        // If listening succeeds, port is available
        tester.close(() => resolve(true));
      })
      .listen(port);
  });
}

// Get PID file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pidFilePath = path.join(__dirname, "..", ".figma-mcp-server.pid");

// Find process using port (for Mac)
async function findProcessUsingPort(port: number): Promise<number | null> {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -t`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null);
        return;
      }

      const pid = parseInt(stdout.trim(), 10);
      resolve(isNaN(pid) ? null : pid);
    });
  });
}

// Check if previous process is running
function checkPreviousProcess(): boolean {
  try {
    if (fs.existsSync(pidFilePath)) {
      const pid = parseInt(fs.readFileSync(pidFilePath, "utf8").trim(), 10);
      try {
        // Check if process exists (if no error, process exists)
        process.kill(pid, 0);
        console.error(`Previous process (PID: ${pid}) is still running.`);
        return true;
      } catch (e) {
        // If process doesn't exist, delete PID file
        fs.unlinkSync(pidFilePath);
      }
    }
  } catch (error) {
    console.error("Error checking previous process:", error);
  }
  return false;
}

// Save current PID
function savePid(): void {
  try {
    fs.writeFileSync(pidFilePath, process.pid.toString(), "utf8");
  } catch (error) {
    console.error("Error saving PID file:", error);
  }
}

// Server startup process
async function startServer() {
  // Check previous process
  if (checkPreviousProcess()) {
    console.error("Another instance of figma-mcp-server is already running.");
    console.error(
      "If you are sure no other instance is running, delete the PID file:"
    );
    console.error(`  rm ${pidFilePath}`);
    process.exit(1);
  }

  // Check port availability
  if (!(await isPortAvailable(PORT))) {
    console.error(`Port ${PORT} is already in use.`);

    // Identify process using port
    const pid = await findProcessUsingPort(PORT);
    if (pid) {
      console.error(`Process with PID ${pid} is using port ${PORT}.`);
      console.error("You can terminate this process with:");
      console.error(`  kill ${pid}`);
    }

    console.error(
      "Please terminate the process using port 5678 and try again."
    );
    process.exit(1);
  }

  // Save current PID
  savePid();

  // Start server
  httpServer = serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    () => {
      console.error(`Plugin communication server running on port ${PORT}`);
    }
  );

  // Inject WebSocket support
  injectWebSocket(httpServer);

  // Start MCP server
  await mcpServer.run().catch(console.error);
}

// Shutdown process
async function shutdown(signal: string) {
  console.error(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Close HTTP server
    if (httpServer) {
      httpServer.close(() => {
        console.error("HTTP server closed.");
      });
    }

    // Close MCP server
    await mcpServer.shutdown();
    console.error("MCP server closed.");

    // Remove PID file
    try {
      if (fs.existsSync(pidFilePath)) {
        fs.unlinkSync(pidFilePath);
      }
    } catch (error) {
      console.error("Error removing PID file:", error);
    }

    console.error("Shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }

  // Force shutdown after 5 seconds (prevent hang)
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 5000);
}

// Set signal handlers
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGHUP", () => shutdown("SIGHUP"));

// Handle unexpected exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});

// Start server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
