// addAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config(); // loads your .env (for MONGO_URI)

const MONGO_URI = process.env.MONGO_URI || "your_mongodb_connection_string_here";

// Define schema (or import your existing model)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.model("User", userSchema, "users"); // "users" collection

async function addAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const name = "Allyza Guingab";
    const email = "allyzaguingab@example.com";
    const pass
