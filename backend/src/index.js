require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const productRoutes = require("./routes/product.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", productRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Connect DB then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
