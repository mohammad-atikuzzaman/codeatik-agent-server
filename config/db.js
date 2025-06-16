import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongodb Connected");
  } catch (err) {
    console.error("Database connection Error at db.js => line 6", err);
    process.exit(1);
  }
};
export default connectDB;
