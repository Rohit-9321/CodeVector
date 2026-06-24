const express = require("express");
const router = express.Router();
const { getProducts, getCategories, simulateChanges } = require("../controllers/product.controller");

router.get("/products", getProducts);
router.get("/categories", getCategories);

// POST /api/simulate-changes
// Inserts 50 new products + updates 50 existing ones.
// Use this to prove that ongoing pagination sessions stay correct under live data changes.
router.post("/simulate-changes", simulateChanges);

module.exports = router;
