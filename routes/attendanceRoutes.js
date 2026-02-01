const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");

async function generateAttendanceId() {
  const count = await Attendance.countDocuments();
  return "ATT" + String(count + 1).padStart(4, "0");
}

// GET /newapi/attendance  (list)
router.get("/", async (req, res) => {
  try {
    const items = await Attendance.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ attendance list error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST /newapi/attendance  (mark attendance)
router.post("/", async (req, res) => {
  try {
    const staffId = (req.body.staffId || "").trim();
    const status = (req.body.status || "Present").trim();
    const date = (req.body.date || "").trim(); // "DD/MM/YYYY"
    const time = (req.body.time || "").trim();

    if (!staffId) return res.status(400).json({ success: false, error: "staffId is required" });
    if (!date) return res.status(400).json({ success: false, error: "date is required" });

    // get staffName from staff collection (safe)
    const staff = await Staff.findOne({ staffId }).lean();
    const staffName = staff?.name || req.body.staffName || "";

    // If already marked today, update it instead of failing
    const existing = await Attendance.findOne({ staffId, date });

    if (existing) {
      existing.status = status;
      existing.time = time || new Date().toLocaleTimeString("en-GB");
      existing.staffName = staffName;
      await existing.save();

      return res.json({ success: true, item: existing, updated: true });
    }

    const attendanceId = await generateAttendanceId();

    const created = await Attendance.create({
      attendanceId,
      staffId,
      staffName,
      date,
      time: time || new Date().toLocaleTimeString("en-GB"),
      status
    });

    res.json({ success: true, item: created, updated: false });
  } catch (err) {
    console.error("❌ attendance create error:", err);

    // unique index error (staffId+date)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: "Attendance already marked for today" });
    }

    res.status(500).json({ success: false, error: "Failed to mark attendance" });
  }
});

module.exports = router;
