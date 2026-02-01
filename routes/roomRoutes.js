const express = require('express');
//import Room from "../models/Room.js";
const Room = require('../models/Rooms.js')

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const items = await Room.find({}).sort({ floor: 1, roomNumber: 1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ GET /rooms:", err);
    res.status(500).json({ success: false, error: "Failed to load rooms" });
  }
});

// ✅ ADD room
router.post("/", async (req, res) => {
  try {
    const { floor, roomNumber, status, type, price } = req.body || {};

    if (!roomNumber) {
      return res.status(400).json({ success: false, error: "roomNumber is required" });
    }

    const exists = await Room.findOne({ roomNumber: String(roomNumber) });
    if (exists) {
      return res.status(409).json({ success: false, error: "Room already exists" });
    }

    const created = await Room.create({
      floor: String(floor || "").toLowerCase(),
      roomNumber: String(roomNumber),
      status: String(status || "available").toLowerCase(), // available/occupied
      type: String(type || ""),
      price: Number(price || 0),
    });

    res.json({ success: true, room: created });
  } catch (err) {
    console.error("❌ POST /rooms:", err);
    res.status(500).json({ success: false, error: "Failed to create room" });
  }
});

// ✅ UPDATE room (by roomNumber)
router.put("/:roomNumber", async (req, res) => {
  try {
    const roomNumber = String(req.params.roomNumber);

    const update = {};
    if (req.body.floor !== undefined) update.floor = String(req.body.floor || "").toLowerCase();
    if (req.body.status !== undefined) update.status = String(req.body.status || "available").toLowerCase();
    if (req.body.type !== undefined) update.type = String(req.body.type || "");
    if (req.body.price !== undefined) update.price = Number(req.body.price || 0);

    const saved = await Room.findOneAndUpdate(
      { roomNumber },
      { $set: update },
      { new: true }
    );

    if (!saved) return res.status(404).json({ success: false, error: "Room not found" });

    res.json({ success: true, room: saved });
  } catch (err) {
    console.error("❌ PUT /rooms/:roomNumber:", err);
    res.status(500).json({ success: false, error: "Failed to update room" });
  }
});

// ✅ DELETE room (by roomNumber)
router.delete("/:roomNumber", async (req, res) => {
  try {
    const roomNumber = String(req.params.roomNumber);

    const room = await Room.findOne({ roomNumber });
    if (!room) return res.status(404).json({ success: false, error: "Room not found" });

    // optional safety
    if (String(room.status).toLowerCase() === "occupied") {
      return res.status(400).json({ success: false, error: "Cannot delete occupied room" });
    }

    await Room.deleteOne({ roomNumber });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /rooms/:roomNumber:", err);
    res.status(500).json({ success: false, error: "Failed to delete room" });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const rooms = req.body; // array of rooms

    for (const r of rooms) {
      if (!r["Room Number"]) continue;

      await Room.updateOne(
        { roomNumber: String(r["Room Number"]) },
        {
          $set: {
            floor: r.Floor,
            roomNumber: String(r["Room Number"]),
            status: r.Status || "available",
            type: r.Type || "",
            raw: r
          }
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: "Rooms saved to MongoDB" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE room status


module.exports = router;
