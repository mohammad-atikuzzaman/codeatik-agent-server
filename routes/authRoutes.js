import express from "express";
import passport from "passport";
import {
  register,
  login,
  googleCallback,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
router.get(
  "/callback/google",
  passport.authenticate("google", { session: false }),
  googleCallback
);

export default router;
