import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, default: "user" },
  googleId: { type: String },
});

export default mongoose.model("User", userSchema);
