require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const productRoutes = require("./src/routes/productRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const mpesaRoutes = require("./src/routes/mpesaRoutes"); // Import M-Pesa routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Body parser for JSON requests

// Serve static files (HTML, CSS, JS) - Placed before API routes
// app.use(express.static(path.join(__dirname, "public"))); // Removed: Uploaded images now served by Cloudinary

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nova-wear";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1); // Exit process with failure
  });

// API Routes - Placed after static middleware
app.use("/api", productRoutes);
app.use("/api", contactRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/mpesa", mpesaRoutes); // Use M-Pesa routes

// Catch-all route to serve index.html for client-side routing
// This MUST be the last route handler
app.get("*", (req, res) => {
  // Serve the main HTML file for any request not handled by static files or API routes
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
