const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

// SQLite DB
const db = new sqlite3.Database("./factory.db");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, product TEXT, quantity INTEGER, status TEXT)");
});

// Simulate delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Order Service
app.post("/order", async (req, res) => {
  const { product, quantity } = req.body;
for (let i = 0; i < 1000; i++) {
  db.run("INSERT INTO orders(product, quantity, status) VALUES ('Bulk', 1, 'CREATED')");
}

  db.run(
    "INSERT INTO orders(product, quantity, status) VALUES (?, ?, ?)",
    [product, quantity, "CREATED"]
  );

  try {
    await axios.post("http://localhost:5000/production", { product, quantity });
    res.json({ message: "Order processed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Production failed" });
  }
});

// Production Service
app.post("/production", async (req, res) => {
  const { product, quantity } = req.body;

  await delay(2000);
  await axios.post("http://localhost:5000/inventory", { product, quantity });

  res.json({ message: "Production completed" });
});

// Inventory Service
app.post("/inventory", async (req, res) => {
  const { product, quantity } = req.body;

  await delay(150);

  // Simulated failure
  if (quantity > 100) {
    return res.status(500).json({ error: "Insufficient raw material" });
  }

  await axios.post("http://localhost:5000/quality", { product });

  res.json({ message: "Inventory updated" });
});

// Quality Service
app.post("/quality", async (req, res) => {
  await delay(100);

  // Random defect simulation
  if (Math.random() < 0.2) {
    return res.status(500).json({ error: "Quality check failed" });
  }

  res.json({ message: "Quality approved" });
});

app.listen(5000, () => {
  console.log("Manufacturing app running on port 5000");
});
