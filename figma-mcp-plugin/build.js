const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

console.log("🛠️ Building the figma-mcp-plugin...");
try {
  // Ensure build directory exists
  const buildDir = path.join(__dirname, "build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Build code.ts
  esbuild.buildSync({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: path.join(buildDir, "code.js"),
    target: "es2017",
    format: "iife",
    platform: "browser",
  });

  // Generate HTML from ui.ts
  const html = fs
    .readFileSync("src/ui.ts", "utf8")
    .replace("export default html;", "")
    .replace("const html = `", "")
    .replace("`;", "");

  fs.writeFileSync(path.join(buildDir, "ui.html"), html);

  console.log("✅ figma-mcp-plugin built successfully");
} catch (error) {
  console.error("❌ Error building figma-mcp-plugin:", error);
  process.exit(1);
}
