import express, { type Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./db";
import { seedDatabase } from "./seed";

const app = express();
const apiRouter = Router();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectDB();
  await seedDatabase();

  // Register API routes on the apiRouter first
  // Test endpoint to verify API routes work
  apiRouter.get("/api/test", (req, res) => {
    res.json({ status: "API routes working" });
  });

  // Register all other API routes
  await registerRoutes(apiRouter);

  // Mount the API router BEFORE Vite middleware
  app.use(apiRouter);

  if (process.env.NODE_ENV === "development") {
    // In development: set up Vite after API routes
    await setupVite(app);
  } else {
    // In production: just serve static files
    serveStatic(app);
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number }).status || (err as { statusCode?: number }).statusCode || 500;
    const message = (err as { message?: string }).message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  const port = 5000;
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
