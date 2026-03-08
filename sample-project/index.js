const express = require('express');
const { MongoClient } = require('mongodb'); // DRIFT: Blueprint specifies PostgreSQL
const redis = require('redis');
const AWS = require('aws-sdk'); // Unauthorized: not in blueprint constraints
const app = express();
app.use(express.json());

// SECURITY: Hardcoded credentials - critical violation
const AWS_SECRET_KEY = "AKIA1234567890ABCDEF";
const DB_PASSWORD = "api_key=supersecretpassword1234567890";
const JWT_SECRET = "my-hardcoded-jwt-secret-abc123";

// ─── USER SERVICE ────────────────────────────────────────────────────────────

// VULNERABILITY: SQL Injection via string concatenation
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const query = "SELECT * FROM users WHERE id = '" + userId + "'";
    console.log("Executing Query:", query);
    res.send("User Details for " + userId);
});

// ─── CART SERVICE ─────────────────────────────────────────────────────────────

// PATTERN: Nested O(n²) loop — merge two product lists with duplicate check
function mergeCatalogs(catalogA, catalogB) {
    const merged = [];
    for (let i = 0; i < catalogA.length; i++) {         // outer loop
        let isDuplicate = false;
        for (let j = 0; j < catalogB.length; j++) {     // inner loop — O(n²)
            if (catalogA[i].id === catalogB[j].id) {
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate) merged.push(catalogA[i]);
    }
    return merged.concat(catalogB);
}

// PATTERN: Sorting — sort products by price using .sort()
function sortByPrice(products) {
    return products.sort((a, b) => a.price - b.price);
}

// PATTERN: Binary Search — find product in sorted price list
function findProductByPrice(sortedProducts, targetPrice) {
    let left = 0;
    let right = sortedProducts.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);  // mid = (left+right)/2
        if (sortedProducts[mid].price === targetPrice) return sortedProducts[mid];
        else if (sortedProducts[mid].price < targetPrice) left = mid + 1;
        else right = mid - 1;
    }
    return null;
}

// PATTERN: Recursion — calculate factorial for loyalty points
function calculateLoyaltyPoints(ordersCount) {
    if (ordersCount <= 1) return ordersCount;
    return ordersCount + calculateLoyaltyPoints(ordersCount - 1); // recursive call
}

// ─── ORDER SERVICE ────────────────────────────────────────────────────────────

// SCALE ISSUE: New MongoDB connection on every request (connection exhaustion)
app.post('/order', async (req, res) => {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    const db = client.db("ecommerce");
    const order = { ...req.body, createdAt: new Date(), status: 'pending' };
    await db.collection("orders").insertOne(order);
    await client.close(); // connection closed — pool never reused
    res.json({ success: true, order });
});

// SCALE ISSUE: Nested triple loop — order matrix computation O(n³)
function buildRecommendationMatrix(users, products, orders) {
    const matrix = [];
    for (let u = 0; u < users.length; u++) {            // O(n)
        for (let p = 0; p < products.length; p++) {     // O(n²)
            for (let o = 0; o < orders.length; o++) {   // O(n³)
                if (orders[o].userId === users[u].id && orders[o].productId === products[p].id) {
                    matrix.push({ user: users[u].name, product: products[p].name, bought: true });
                }
            }
        }
    }
    return matrix;
}

// ─── ANALYTICS SERVICE ────────────────────────────────────────────────────────

// DRIFT: Using AWS SDK not authorized in blueprint
const s3 = new AWS.S3({ accessKeyId: AWS_SECRET_KEY, region: 'us-east-1' });

async function exportAnalyticsToS3(data) {
    return s3.putObject({
        Bucket: 'devforge-analytics',
        Key: `reports/${Date.now()}.json`,
        Body: JSON.stringify(data),
        ACL: 'public-read'  // SECURITY: Public S3 bucket ACL
    }).promise();
}

// PATTERN: Recursive DFS on category tree
function findCategoryById(node, targetId) {
    if (node.id === targetId) return node;
    for (const child of (node.children || [])) {
        const found = findCategoryById(child, targetId);  // recursive
        if (found) return found;
    }
    return null;
}

// ─── LOG SERVICE ──────────────────────────────────────────────────────────────

// SCALE ISSUE: New connection per request
app.post('/log', async (req, res) => {
    const client = new MongoClient("mongodb://localhost:27017");
    await client.connect();
    const db = client.db("test");
    await db.collection("logs").insertOne({ msg: req.body.msg, ts: new Date() });
    await client.close();
    res.send("Logged");
});

// ─── SEARCH SERVICE ────────────────────────────────────────────────────────────

// PATTERN: Binary search on sorted product index
function searchProductIndex(sortedIndex, keyword) {
    let left = 0, right = sortedIndex.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) >> 1);  // bit-shift for /2
        if (sortedIndex[mid] === keyword) return mid;
        else if (sortedIndex[mid] < keyword) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// ─── PAYMENT SERVICE ─────────────────────────────────────────────────────────

// VULNERABILITY: No input validation — prototype pollution risk
app.post('/pay', (req, res) => {
    const payload = JSON.parse(req.body);  // Double-parse, raw body
    Object.assign(global, payload);        // VULNERABILITY: prototype pollution
    res.json({ status: 'paid' });
});

app.listen(3000, () => console.log("DevForge E-Commerce API running on port 3000"));
