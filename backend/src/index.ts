import express, { Express, Router } from "express";
import { router as docs } from "./docs";

// Register all the sub-API endpoints: /doc, /category, etc.
const api = Router();
api.use("/docs", docs);

// Register the api endpoints with the app
const app: Express = express();
app.use("/api/v1", api);

// Serve the app
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
