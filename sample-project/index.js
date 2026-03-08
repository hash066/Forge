const express = require('express');
const { MongoClient } = require('mongodb'); // DRIFT: Blueprint says PostgreSQL
const app = express();

// SECURITY: Hardcoded API Key
const AWS_SECRET_KEY = "AKIA1234567890ABCDEF"; 

// VULNERABILITY: SQL Injection (Simulated via string concatenation)
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    console.log("Executing Query:", query);
    res.send("User Details for " + userId);
});

// SCALE ISSUE: Creating new connection per request (monolith connection exhaustion)
app.post('/log', async (req, res) => {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    const db = client.db("test");
    await db.collection("logs").insertOne({ msg: "Log entry" });
    await client.close();
    res.send("Logged");
});

app.listen(3000, () => {
    console.log("E-Commerce Sample running on port 3000");
});
