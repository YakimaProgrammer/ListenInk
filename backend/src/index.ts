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
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", api);

// Serve the app
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
