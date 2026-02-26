import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));

// ------------------
// MongoDB Connection
// ------------------
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB Atlas Connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// ------------------
// Schema & Model
// ------------------
const tradeSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        tradingIndex: {
            type: String,
            required: true,
            trim: true
        },
        profit: {
            type: Number,
            default: 0
        },
        loss: {
            type: Number,
            default: 0
        },
        accountBalance: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

const Trade = mongoose.model("Trade", tradeSchema);

// ------------------
// ROUTES
// ------------------

// READ ALL
app.get("/api/trades", async (req, res) => {
    try {
        const trades = await Trade.find().sort({ createdAt: -1 });
        res.json(trades);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/trades", async (req, res) => {
    try {
        const { date, time, tradingIndex, profit, loss, accountBalance } = req.body;

        if (!date || !time || !tradingIndex || accountBalance === undefined) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        if ((profit && loss) || (!profit && !loss)) {
            return res.status(400).json({
                message: "Enter either Profit OR Loss, not both"
            });
        }

        const newTrade = await Trade.create({
            date,
            time,
            tradingIndex,
            profit: profit || 0,
            loss: loss || 0,
            accountBalance
        });

        res.status(201).json(newTrade);

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE
app.delete("/api/trades/:id", async (req, res) => {
    try {
        const deleted = await Trade.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Trade not found" });
        }

        res.json({ message: "Deleted successfully" });

    } catch (error) {
        res.status(400).json({ message: "Invalid ID" });
    }
});

// ------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});