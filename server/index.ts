import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CORS configuration - allow requests from Vercel frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins in production
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    
    // Only log server errors (5xx), don't exit on client errors (4xx)
    if (status >= 500) {
      console.error("Server error:", err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT from environment for deployment compatibility, fallback to 5000 for local development
  const port = Number(process.env.PORT) || 5000;
  
  // Add server error handling
  server.on("error", (err: any) => {
    log(`Server startup error: ${err.message}`);
    console.error("Server error:", err);
    process.exit(1);
  });
  
  // Add global error handlers for unhandled errors (production only to avoid dev restart issues)
  if (process.env.NODE_ENV === "production") {
    process.on("unhandledRejection", (reason: any, promise: any) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
    
    process.on("uncaughtException", (error: any) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } else {
    // In development, log but don't exit to avoid restart loops
    process.on("unhandledRejection", (reason: any, promise: any) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
    
    process.on("uncaughtException", (error: any) => {
      console.error("Uncaught Exception:", error);
    });
  }
  
  // Start server with autoscale-compatible configuration
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
