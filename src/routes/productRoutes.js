const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");

const router = express.Router();

// --- Multer Configuration for Image Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the directory exists (it should, from the previous step)
    cb(null, path.join(__dirname, "../../public/uploads/products"));
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } }); // Limit file size to 5MB

// --- Product API Routes ---

// @route   GET /api/products/featured-products (Existing - renamed for clarity)
// @desc    Get featured products (limit to 4 for the homepage)
// @access  Public
router.get("/products/featured", async (req, res) => {
  try {
    const products = await Product.find().limit(4);
    res.json(products);
  } catch (err) {
    console.error("Error fetching featured products:", err.message);
    res.status(500).json({ msg: "Server Error: Could not fetch products" });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (should be protected in a real app)
router.post("/products", upload.single("productImage"), async (req, res) => {
  const { name, category, price } = req.body;

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({ msg: "Product image is required." });
  }

  // Construct the image URL path (relative to the public folder)
  const imageUrl = `/uploads/products/${req.file.filename}`;

  try {
    // Basic validation
    if (!name || !category || !price) {
      return res.status(400).json({ msg: "Please fill in all required fields (name, category, price)." });
    }

    const newProduct = new Product({
      name,
      category,
      price: parseFloat(price), // Ensure price is a number
      image: imageUrl, // Save the path to the image
    });

    const product = await newProduct.save();
    res.status(201).json(product);

  } catch (err) {
    console.error("Error creating product:", err.message);
    // Handle validation errors
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed. Please check your input." });
    }
    // Handle Multer errors (e.g., file size limit)
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ msg: `File upload error: ${err.message}` });
    }
    // Handle custom file filter error
    if (err.message === "Not an image! Please upload only images.") {
        return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: "Server Error: Could not create product." });
  }
});

// TODO: Add routes for GET /products, GET /products/:id, PUT /products/:id, DELETE /products/:id

module.exports = router;



// @route   GET /api/products
// @desc    Get all products, optionally filtered by category or search term
// @access  Public
router.get("/products", async (req, res) => {
  const { category, search } = req.query; // Get category and search term
  let query = {};

  // Handle category filtering
  if (category && category !== 'all' && category !== 'new') {
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  // Handle search term filtering (searches name and category)
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' }; // Case-insensitive search
    // If category is already specified, add search to it using $and
    if (query.category) {
        query = {
            $and: [
                { category: query.category },
                { $or: [{ name: searchRegex }, { category: searchRegex }] } // Search name OR category
            ]
        };
    } else {
        // Otherwise, search name OR category
        query.$or = [{ name: searchRegex }, { category: searchRegex }];
    }
  }

  // Note: 'new' arrivals might need different logic, e.g., sorting by creation date

  try {
    const products = await Product.find(query).sort({ name: 1 }); // Apply combined query filter
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ msg: "Server Error: Could not fetch products" });
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Public (or Private for admin)
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    res.status(500).json({ msg: "Server Error: Could not fetch product" });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (text fields only for now)
// @access  Private (should be protected)
router.put("/products/:id", async (req, res) => {
  const { name, category, price } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (category) updateData.category = category;
  if (price) updateData.price = parseFloat(price);

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ msg: "No update data provided." });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    res.json(product);

  } catch (err) {
    console.error("Error updating product:", err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        const firstError = Object.values(errors)[0];
        return res.status(400).json({ msg: firstError || "Validation failed. Please check your input." });
    }
    res.status(500).json({ msg: "Server Error: Could not update product" });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (should be protected)
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Optional: Delete the associated image file from storage
    // const imagePath = path.join(__dirname, "../../public", product.image);
    // require('fs').unlink(imagePath, (err) => {
    //   if (err) console.error("Error deleting product image file:", err);
    // });

    await Product.findByIdAndDelete(req.params.id);

    res.json({ msg: "Product removed successfully" });

  } catch (err) {
    console.error("Error deleting product:", err.message);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ msg: "Invalid Product ID format" });
    }
    res.status(500).json({ msg: "Server Error: Could not delete product" });
  }
});

module.exports = router;
