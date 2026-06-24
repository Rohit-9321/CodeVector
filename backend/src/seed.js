require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

const CATEGORIES = [
  "Electronics", "Clothing", "Books", "Home & Garden",
  "Sports", "Toys", "Food", "Beauty", "Automotive", "Jewelry",
];

const ADJECTIVES = [
  "Premium", "Budget", "Deluxe", "Standard", "Pro",
  "Lite", "Ultra", "Mini", "Mega", "Classic",
];

const NOUNS = [
  "Widget", "Gadget", "Device", "Tool", "Kit",
  "Set", "Pack", "Bundle", "Unit", "Module",
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateBatch(batchSize, batchIndex) {
  const docs = [];
  for (let i = 0; i < batchSize; i++) {
    const productNumber = batchIndex * batchSize + i + 1;
    const ageMs = Math.random() * 365 * 24 * 60 * 60 * 1000;
    const createdAt = new Date(Date.now() - ageMs);
    docs.push({
      name: `${randomItem(ADJECTIVES)} ${randomItem(NOUNS)} #${productNumber}`,
      category: randomItem(CATEGORIES),
      price: parseFloat((Math.random() * 999 + 1).toFixed(2)),
      createdAt,
      updatedAt: createdAt,
    });
  }
  return docs;
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected.");

  await Product.deleteMany({});
  console.log("Cleared existing products.");

  const TOTAL = 200000;
  const BATCH_SIZE = 5000;
  const TOTAL_BATCHES = TOTAL / BATCH_SIZE;

  console.log(`Inserting ${TOTAL.toLocaleString()} products in ${TOTAL_BATCHES} batches...`);

  const start = Date.now();
  for (let b = 0; b < TOTAL_BATCHES; b++) {
    const batch = generateBatch(BATCH_SIZE, b);
    await Product.insertMany(batch, { ordered: false });
    process.stdout.write(`\r  Batch ${b + 1}/${TOTAL_BATCHES} done`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone! Inserted ${TOTAL.toLocaleString()} products in ${elapsed}s.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
