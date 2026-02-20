const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());


// DATABASE CONNECTION POOL

const pool = mysql.createPool({
    host: "localhost",
    user: "ecommerceuser",
    password: "password", // <-- Change this
    database: "ecommerce",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// HEALTH CHECK

app.get("/", (req, res) => {
    res.send("Ecommerce Order Service Running");
});


// GET ALL ORDERS
// SCENARIOS:
// 1. Slow response
// 2. Random error spike

app.get("/orders", async (req, res) => {
    try {

        // ---- SCENARIO: Slow API ----
        if (req.query.slow === "true") {
            console.log("Simulating slow API...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // ---- SCENARIO: Random Errors ----
        if (req.query.error === "true") {
            if (Math.random() < 0.4) {
                console.log("Simulating random error...");
                return res.status(500).send("Random failure occurred");
            }
        }

        const [rows] = await pool.query("SELECT * FROM orders");
        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// CREATE ORDER

app.post("/orders", async (req, res) => {
    try {
        const { product, quantity } = req.body;

        if (!product || !quantity) {
            return res.status(400).send("Product and quantity required");
        }

        await pool.query(
            "INSERT INTO orders (product, quantity, status) VALUES (?, ?, ?)",
            [product, quantity, "NEW"]
        );

        res.json({ message: "Order created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating order");
    }
});


// NORMAL UPDATE ORDER

app.put("/orders/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "UPDATE orders SET status='PROCESSING' WHERE id=?",
            [id]
        );

        res.json({ message: "Order updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating order");
    }
});


// SCENARIO: LONG TRANSACTION
// REAL PRODUCTION DB LOCK ISSUE

app.put("/orders/:id/slow", async (req, res) => {

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        console.log("Starting long transaction...");

        await connection.query(
            "UPDATE orders SET status='PROCESSING' WHERE id=?",
            [req.params.id]
        );

        // Simulate long-running transaction
        await new Promise(resolve => setTimeout(resolve, 10000));

        await connection.commit();

        res.json({ message: "Order updated with long transaction" });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send("Transaction failed");
    } finally {
        connection.release();
    }
});


// SCENARIO: CPU SPIKE

app.get("/cpu", (req, res) => {
    console.log("Simulating CPU spike...");
    while (true) {}
});


// SERVER START

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});