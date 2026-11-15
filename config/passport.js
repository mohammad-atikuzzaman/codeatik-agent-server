import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google profile"), null);
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find existing user by googleId OR email
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: normalizedEmail }],
        });

        if (user) {
          // Link googleId if user registered previously with password
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user if not exists
        user = await User.create({
          googleId: profile.id,
          email: normalizedEmail,
          role: "user",
        });

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth strategy error:", err);
        return done(err, null);
      }
    }
  )
);
