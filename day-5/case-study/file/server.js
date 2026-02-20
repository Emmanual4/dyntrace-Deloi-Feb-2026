const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "YOUR_PASSWORD",
    database: "elearning",
    waitForConnections: true,
    connectionLimit: 10
});

// HOME
app.get("/", (req, res) => {
    res.send("EduSmart E-Learning Platform Running");
});

// AUTH SERVICE
app.post("/login", async (req, res) => {
    if (Math.random() < 0.1) {
        return res.status(500).send("Authentication failure");
    }
    res.json({ message: "Login successful" });
});

// COURSE SERVICE
app.get("/courses", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM courses");
    res.json(rows);
});

// VIDEO STREAMING SERVICE
app.get("/video/:id", async (req, res) => {

    if (req.query.slow === "true") {
        await new Promise(resolve => setTimeout(resolve, 4000));
    }

    res.json({ message: "Video streaming..." });
});

// PAYMENT SERVICE
app.post("/payment", async (req, res) => {

    if (req.query.error === "true") {
        return res.status(500).send("Payment Gateway Error");
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            "UPDATE courses SET enrolled = enrolled + 1 WHERE id=1"
        );

        if (req.query.lock === "true") {
            await new Promise(resolve => setTimeout(resolve, 15000));
        }

        await connection.commit();
        res.json({ message: "Payment Successful" });

    } catch (err) {
        await connection.rollback();
        res.status(500).send("Payment Failed");
    } finally {
        connection.release();
    }
});

// CPU SPIKE
app.get("/cpu", (req, res) => {
    while (true) {}
});

app.listen(3000, () => {
    console.log("E-Learning Platform running on port 3000");
});