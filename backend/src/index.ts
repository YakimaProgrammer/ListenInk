// backend/src/index.ts
import express, { Express, Router } from "express";
import cookieParser from "cookie-parser";
import { router as docs } from "./docs";
import { router as auth } from "./auth";
import { router as category } from "./categories";

// Register all the sub-API endpoints: /docs, /category, etc.
const api = Router();
api.use("/docs", docs);
api.use("/auth", auth);
api.use("/categories", category);

// Register the api endpoints with the app
const app: Express = express();

// Add CORS middleware before other middleware
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    // Allow requests from frontend development server
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");

    // Allow cookies to be sent
    res.header("Access-Control-Allow-Credentials", "true");

    // Allow specific headers
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    // Allow specific methods
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  }
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", api);

// Serve the app
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
