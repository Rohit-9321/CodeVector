const express = require("express");
const router = express.Router();
const { getProducts, getCategories, simulateChanges } = require("../controllers/product.controller");

router.get("/products", getProducts);
router.get("/categories", getCategories);

router.post("/simulate-changes", simulateChanges);

module.exports = router;
