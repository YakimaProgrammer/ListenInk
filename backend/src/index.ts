import express, { Express, Router } from "express";
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import passport from "passport";
import { router as docs } from "./docs";
import { router as auth } from "./auth";
import { router as category } from "./categories";

import { SESSION_SECRETS } from "./secrets.json";

// Register all the sub-API endpoints: /docs, /category, etc.
const api = Router();
api.use("/docs", docs);
api.use("/auth", auth);
api.use("/categories", category);

const app: Express = express();
// Register middlewares to extend express: json body parsing, session cookies, and Google SSO
app.use(express.json())
app.set('trust proxy', 1);
app.use(session({
  secret: SESSION_SECRETS,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000 // Sessions are valid for two hours
  },
  store: new PrismaSessionStore(
    new PrismaClient(),
    {
      checkPeriod: 2 * 60 * 1000,  // Check for expired sessions every 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  )
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
