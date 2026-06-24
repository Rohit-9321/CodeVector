const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    category: { type: String, required: true },
    price:    { type: Number, required: true },
  },
  {
    timestamps: true, // auto-creates createdAt and updatedAt
  }
);

// Compound indexes to support cursor-based pagination queries
// Without these, every query would be a full collection scan on 200k docs
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ category: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model("Product", productSchema);
