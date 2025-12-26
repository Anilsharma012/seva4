import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, type ViteDevServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.resolve(__dirname, "..");
const clientPath = path.resolve(__dirname, "..", "client");
const distPath = path.resolve(__dirname, "..", "dist", "public");

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express) {
  const vite = await createViteServer({
    configFile: path.resolve(rootPath, "vite.config.ts"),
    server: { middlewares: true },
    appType: "spa",
  });

  // Apply Vite's middleware for development server HMR and module serving
  app.use(vite.middlewares);

  // Fallback: serve index.html for SPA routing
  app.use((req, res) => {
    res.sendFile(path.resolve(clientPath, "index.html"));
  });
}

export function serveStatic(app: Express) {
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, { maxAge: "1d" }));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
