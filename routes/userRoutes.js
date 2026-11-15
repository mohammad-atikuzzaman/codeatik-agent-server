import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", authenticate, authorizeRole("admin"), async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/change-role",
  authenticate,
  authorizeRole("admin"),
  async (req, res, next) => {
    try {
      const { email, role } = req.body;
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      user.role = role;
      await user.save();
      res.json({ message: `User role updated to ${role}`, user: { email: user.email, role: user.role } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
