import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { PrismaClient } from '@prisma/client';
import { ApiResponse, User, UserOrError } from "./types";
import { GOOGLE_SECRETS, S3_BUCKET } from "./secrets.json";
import { getFromBucket, putToBucket } from "./upload";

const prisma = new PrismaClient();

export const router = Router();

// It turns out Request and AuthenticatedRequest are two very different things
export function withAuth<T>(handler: (req: Request & Express.AuthenticatedRequest, res: Response<ApiResponse<T>>, next: NextFunction) => unknown): RequestHandler {
  return function (req: Request, res: Response<ApiResponse<T>>, next: NextFunction) {
    if (req.isAuthenticated()) {
      handler(req, res, next);
    } else {
      res.status(401).json({ success: false, err: 'Unauthorized' });
    }
  };
}

passport.use(new GoogleStrategy({
    clientID: GOOGLE_SECRETS.web.client_id,
    clientSecret: GOOGLE_SECRETS.web.client_secret,
    callbackURL: new URL(GOOGLE_SECRETS.web.redirect_uris[0]).pathname
  },
  async (_accessToken, _refreshToken, profile, cb) => {
    const mappedId: string = `google:${profile.id}`;
    const email: string | undefined = profile.emails?.at(0)?.value;
    const pfp_url: string | undefined = profile.photos?.at(0)?.value;
    // @TODO: what to do about an undefined email? Do we care at all? Both of these *should* be impossible
    if (email === undefined) {
      const error = `[Error] Did not create user ${mappedId} because that user does not have an email address!`;
      console.error(error);
      cb(error, undefined);
    } else if (pfp_url === undefined) {
      const error = `[Error] Did not create user ${mappedId} because that user does not have a profile picture!`;
      console.error(error);
      cb(error, undefined);
    } else {
      const res = await fetch(pfp_url);
      const buf = await res.arrayBuffer()
      await putToBucket(S3_BUCKET, `profile_pictures/${mappedId}.png`, Buffer.from(buf), res.headers.get('content-type') ?? "image/png"); 

      const user: User = await prisma.user.upsert({
	where: {
	  id: mappedId
	},
	create: {
	  id: mappedId,
	  name: profile.displayName,
	  email
	},
	update: {
	  name: profile.displayName,
	  email
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

router.get("/", withAuth<User>((req, res) => {
  res.send({ success: true, data: req.user });
}));

router.get("/profile_picture/:id", withAuth<void>(async (req, res) => {
  try {
    const userId = req.params.id === "@me" ? req.user.id : req.params.id; 
    const { stream, contentType, contentLength, contentDisposition } = await getFromBucket(S3_BUCKET, `profile_pictures/${userId}.png`);

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
    if (stream !== undefined && "pipe" in stream) { // There is prolly a less evil way to do this...
      stream.pipe(res);
    } else {
      res.status(404).send({ success: false, err: "Not found!"});
    }
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).send({ success: false, err: 'Error fetching file'});
  }
}));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback", 
  passport.authenticate("google",{
    successRedirect: process.env.NODE_ENV === "development" ? "http://localhost:3000/" : "",
    failureRedirect: "/api/v1/auth/login/failed",
  })
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get("/login/success", withAuth<User>((req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
}));

router.get("/login/failed", (_, res: Response<UserOrError>) => {
  res.status(401).json({
    success: false,
    err: "failure",
  });
});
