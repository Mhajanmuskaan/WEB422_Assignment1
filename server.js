const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ListingsDB = require("./modules/listingsDB.js");
const db = new ListingsDB();

const app = express();
let isDbInitialized = false;

app.use(cors());
app.use(express.json());

// Lazy database initialization
async function ensureDbInitialized() {
    if (!isDbInitialized) {
        try {
            await db.initialize(process.env.MONGODB_CONN_STRING);
            isDbInitialized = true;
        } catch (err) {
            console.error("Failed to initialize database:", err);
            throw err;
        }
    }
}

// Apply to all requests
app.use(async (req, res, next) => {
    try {
        await ensureDbInitialized();
        next();
    } catch (err) {
        res.status(500).json({ message: "Database initialization failed", error: err.message });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "API listening" });
});

app.post("/api/listings", (req, res) => {
    db.addNewListing(req.body).then(data => {
        res.status(201).json(data);
    }).catch(err => {
        res.status(500).json({ message: "Failed to add listing", error: err });
    });
});

app.get("/api/listings", (req, res) => {
    const page = parseInt(req.query.page);
    const perPage = parseInt(req.query.perPage);
    const name = req.query.name;

    if (!page || !perPage) {
        return res.status(400).json({ message: "page and perPage are required and must be numbers" });
    }

    db.getAllListings(page, perPage, name).then(data => {
        res.json(data);
    }).catch(err => {
        res.status(500).json({ message: "Failed to retrieve listings", error: err });
    });
});

app.get("/api/listings/:id", (req, res) => {
    db.getListingById(req.params.id).then(data => {
        if (!data) {
            res.status(404).json({ message: "Listing not found" });
        } else {
            res.json(data);
        }
    }).catch(err => {
        res.status(500).json({ message: "Error fetching listing", error: err });
    });
});

app.put("/api/listings/:id", (req, res) => {
    db.updateListingById(req.body, req.params.id).then(() => {
        res.status(204).end();
    }).catch(err => {
        res.status(500).json({ message: "Failed to update listing", error: err });
    });
});

app.delete("/api/listings/:id", (req, res) => {
    db.deleteListingById(req.params.id).then(() => {
        res.status(204).end();
    }).catch(err => {
        res.status(500).json({ message: "Failed to delete listing", error: err });
    });
});

// Only run the server if this file is executed directly (not required as a module by Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
