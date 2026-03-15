const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// BU YERGA O'ZINGIZNING MONGODB LINKINGIZNI QO'YISHINGIZ KERAK
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dilyorafayzullayevna_db_user:Dilyora1234@barbershop.lwnto0d.mongodb.net/?appName=barbershop";
const DB_NAME = "husanbarber";

let db;

async function connectDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ MongoDB ga ulandi");
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // HTML faylingiz 'public' papkasi ichida bo'lsin

async function getStatus() {
    const doc = await db.collection("settings").findOne({ key: "status" });
    return doc ? doc.value : "open";
}

app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await db.collection("bookings").find({}).sort({ time: 1 }).toArray();
        const status = await getStatus();
        res.json({ bookings, status });
    } catch (e) {
        res.status(500).json({ error: "Server xatosi" });
    }
});

app.post("/api/bookings", async (req, res) => {
    const { time, name, surname, phone } = req.body;
    try {
        const exists = await db.collection("bookings").findOne({ time });
        if (exists) return res.status(409).json({ error: "Bu vaqt band" });
        await db.collection("bookings").insertOne({ time, name, surname, phone });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Xato" });
    }
});

app.delete("/api/bookings/:time", async (req, res) => {
    const time = decodeURIComponent(req.params.time);
    await db.collection("bookings").deleteOne({ time });
    res.json({ success: true });
});

app.post("/api/status", async (req, res) => {
    const { status } = req.body;
    await db.collection("settings").updateOne(
        { key: "status" },
        { $set: { value: status } },
        { upsert: true }
    );
    res.json({ success: true });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
});
