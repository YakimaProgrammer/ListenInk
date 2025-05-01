import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from '@prisma/client';
import { Err, LoginResult, User } from "./types";
import { GOOGLE_SECRETS } from "./secrets.json";

const prisma = new PrismaClient();

export const router = Router();

passport.use(new GoogleStrategy({
    clientID: GOOGLE_SECRETS.web.client_id,
    clientSecret: GOOGLE_SECRETS.web.client_secret,
    callbackURL: new URL(GOOGLE_SECRETS.web.redirect_uris[0]).pathname
  },
  async (_accessToken, _refreshToken, profile, cb) => {
    const mappedId: string = `google:${profile.id}`;
    const email: string | undefined = profile.emails?.at(0)?.value;
    const profile_picture: string | undefined = profile.photos?.at(0)?.value;
    // @TODO: what to do about an undefined email? Do we care at all? Both of these *should* be impossible
    if (email === undefined) {
      const error = `[Error] Did not create user ${mappedId} because that user does not have an email address!`;
      console.error(error);
      cb(error, undefined);
    } else if (profile_picture === undefined) {
      const error = `[Error] Did not create user ${mappedId} because that user does not have a profile picture!`;
      console.error(error);
      cb(error, undefined);
    } else {
      const user: User = await prisma.user.upsert({
	where: {
	  id: mappedId
	},
	create: {
	  id: mappedId,
	  name: profile.displayName,
	  email,
	  profile_picture
	},
	update: {
	  name: profile.displayName,
	  email,
	  profile_picture
	}
      });

      cb(null, user);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    if (typeof id === "string") {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } else {
      done("Invalid/unspecified id!", undefined);
    }
  } catch (err) {
    done(err, undefined);
  }
});

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

router.get("/", ensureAuthenticated, (req, res: Response<User | Err>) => {
  if (req.user !== undefined) {
    res.send(req.user);
  } else {
    res.send({ err: "Unauthorized" });
  }
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback", 
  passport.authenticate("google",{
    successRedirect: "/api/v1/auth/login/success",
    failureRedirect: "/api/v1/auth/login/failed",
  })
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get("/login/success", (req, res: Response<LoginResult>) => {
  if(req.user) {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Server error: user should be logged in by now",
    });
  }
});

router.get("/login/failed", (_, res: Response<LoginResult>) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});
