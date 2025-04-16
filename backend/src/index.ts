import express, { Express, Router } from "express";
import session from 'express-session';
import passport from "passport";
import { router as docs } from "./docs";
import { router as auth } from "./auth";
import { router as category } from "./categories";

import secrets from "./secrets/session_secrets.json";

// Register all the sub-API endpoints: /docs, /category, etc.
const api = Router();
api.use("/docs", docs);
api.use("/auth", auth);
api.use("/categories", category);


const app: Express = express();
// Register middlewares to extend express: json body parsing, session cookies, and Google SSO
app.use(express.json())
app.use(session({
  secret: secrets,
  resave: false,
  saveUninitialized: false,
  // TODO: cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());

// Register the api endpoints with the app
app.use("/api/v1", api);

// Serve the app
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
