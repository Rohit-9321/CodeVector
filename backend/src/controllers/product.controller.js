const mongoose = require("mongoose");
const Product = require("../models/product.model");

// GET /api/products
// Supports cursor-based pagination + optional category filter
const getProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category || null;
    const cursorParam = req.query.cursor || null;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    if (cursorParam) {
      let cursorData;
      try {
        cursorData = JSON.parse(Buffer.from(cursorParam, "base64").toString("utf8"));
      } catch {
        return res.status(400).json({ error: "Invalid cursor" });
      }

      const { createdAt, _id } = cursorData;

      // Cursor condition: fetch products older than the last seen item
      // Using (createdAt, _id) pair handles ties in timestamp correctly
      filter.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        {
          createdAt: new Date(createdAt),
          _id: { $lt: new mongoose.Types.ObjectId(_id) },
        },
      ];
    }

    // Fetch one extra to determine if a next page exists
    const products = await Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = products.length > limit;
    if (hasNextPage) products.pop();

    let nextCursor = null;
    if (hasNextPage && products.length > 0) {
      const last = products[products.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ createdAt: last.createdAt, _id: last._id })
      ).toString("base64");
    }

    res.json({ products, nextCursor, hasNextPage });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ categories: categories.sort() });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/simulate-changes
// This endpoint exists purely to prove the pagination is stable under data changes.
// It inserts 50 brand-new products (simulating concurrent additions) and updates
// 50 existing products (simulating price/name edits).
// After calling this, the user browsing page 2, 3, etc. must still see no
// duplicates and no skipped items — because the cursor is anchored to createdAt,
// not a row offset.
const simulateChanges = async (req, res) => {
  try {
    const CATEGORIES = [
      "Electronics", "Clothing", "Books", "Home & Garden",
      "Sports", "Toys", "Food", "Beauty", "Automotive", "Jewelry",
    ];

    // Insert 50 new products with createdAt = NOW
    // These will appear at the very TOP of the list (newest first)
    // but will NOT appear in any ongoing paginated session because the
    // cursor already points past them
    const newProducts = Array.from({ length: 50 }, (_, i) => ({
      name: `NEW Injected Product #${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      price: parseFloat((Math.random() * 999 + 1).toFixed(2)),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Product.insertMany(newProducts, { ordered: false });

    // Update 50 random existing products — change their price and updatedAt
    // createdAt stays the same, so their position in pagination doesn't move
    const randomProducts = await Product.aggregate([{ $sample: { size: 50 } }]);
    const updateOps = randomProducts.map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            price: parseFloat((Math.random() * 999 + 1).toFixed(2)),
            name: p.name + " [updated]",
            updatedAt: new Date(),
          },
        },
      },
    }));

    await Product.bulkWrite(updateOps);

    res.json({
      message: "Simulation complete",
      inserted: 50,
      updated: 50,
      explanation:
        "50 new products added (newest, appear at top of list). " +
        "50 existing products updated (price + name changed, createdAt unchanged). " +
        "Any active pagination session remains stable — no duplicates, no skipped items.",
    });
  } catch (err) {
    console.error("simulateChanges error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getProducts, getCategories, simulateChanges };
