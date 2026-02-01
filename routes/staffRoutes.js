const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");

async function generateStaffId() {
  const count = await Staff.countDocuments();
  return "STAFF" + String(count + 1).padStart(4, "0");
}

// GET /newapi/staff
router.get("/", async (req, res) => {
  try {
    const items = await Staff.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ staff list error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST /newapi/staff
router.post("/", async (req, res) => {

  console.log('staf data',req.body)
  try {
    const name = (req.body.name || "").trim();
    const mobile = (req.body.mobile || "").trim();
    const position = (req.body.position || "").trim();
    const salary = Number(req.body.salary || 0);
    const joinDate = req.body.joinDate || "";

    if (!name) return res.status(400).json({ success: false, error: "Name is required" });
    if (Number.isNaN(salary) || salary < 0) {
      return res.status(400).json({ success: false, error: "Invalid salary" });
    }

    const staffId = await generateStaffId();

    const created = await Staff.create({
      staffId,
      name,
      mobile,
      position,
      salary,
      joinDate,
      status: "Active"
    });

    res.json({ success: true, item: created });
  } catch (err) {
    console.error("❌ staff create error:", err);
    res.status(500).json({ success: false, error: "Failed to create staff" });
  }
});

// PUT /newapi/staff/:staffId
router.put("/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;

    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.mobile !== undefined) update.mobile = String(req.body.mobile).trim();
    if (req.body.position !== undefined) update.position = String(req.body.position).trim();
    if (req.body.salary !== undefined) update.salary = Number(req.body.salary);
    if (req.body.joinDate !== undefined) update.joinDate = String(req.body.joinDate);
    if (req.body.status !== undefined) update.status = String(req.body.status);

    if (update.name !== undefined && !update.name) {
      return res.status(400).json({ success: false, error: "Name cannot be empty" });
    }
    if (update.salary !== undefined && (Number.isNaN(update.salary) || update.salary < 0)) {
      return res.status(400).json({ success: false, error: "Invalid salary" });
    }

    const updated = await Staff.findOneAndUpdate({ staffId }, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: "Staff not found" });

    res.json({ success: true, item: updated });
  } catch (err) {
    console.error("❌ staff update error:", err);
    res.status(500).json({ success: false, error: "Failed to update staff" });
  }
});

// DELETE /newapi/staff/:staffId
router.delete("/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    const deleted = await Staff.findOneAndDelete({ staffId });
    if (!deleted) return res.status(404).json({ success: false, error: "Staff not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ staff delete error:", err);
    res.status(500).json({ success: false, error: "Failed to delete staff" });
  }
});

module.exports = router;
