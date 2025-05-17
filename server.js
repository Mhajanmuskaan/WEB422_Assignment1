const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ListingsDB = require("./modules/listingsDB.js");
const db = new ListingsDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "API listening" });
});

// POST /api/listings - Add a new listing
app.post("/api/listings", (req, res) => {
    db.addNewListing(req.body).then(data => {
        res.status(201).json(data);
    }).catch(err => {
        res.status(500).json({ message: "Failed to add listing", error: err });
    });
});

// GET /api/listings?page=1&perPage=5&name=optionalName
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

// GET /api/listings/:id - Get listing by ID
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

// PUT /api/listings/:id - Update listing by ID
app.put("/api/listings/:id", (req, res) => {
    db.updateListingById(req.body, req.params.id).then(() => {
        res.status(204).end();
    }).catch(err => {
        res.status(500).json({ message: "Failed to update listing", error: err });
    });
});

// DELETE /api/listings/:id - Delete listing by ID
app.delete("/api/listings/:id", (req, res) => {
    db.deleteListingById(req.params.id).then(() => {
        res.status(204).end();
    }).catch(err => {
        res.status(500).json({ message: "Failed to delete listing", error: err });
    });
});

// Initialize DB and export app for Vercel
db.initialize(process.env.MONGODB_CONN_STRING).catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
});

module.exports = app;
