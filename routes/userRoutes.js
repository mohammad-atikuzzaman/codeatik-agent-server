import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", authenticate, authorizeRole("admin"), async (req, res) => {
  const user = await User.find();
  res.json(user);
});

router.put(
  "/change-role",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: "User promoted to admin" });
  }
);

export default router;
