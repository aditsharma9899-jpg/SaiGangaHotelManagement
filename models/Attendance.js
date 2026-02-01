const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, required: true, unique: true, index: true }, // ATT0001

    staffId: { type: String, required: true, index: true },
    staffName: { type: String, default: "" },

    date: { type: String, required: true, index: true }, // "DD/MM/YYYY" (en-GB)
    time: { type: String, default: "" },

    status: { type: String, default: "Present" }, // Present / Absent

    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

// optional: prevent duplicate marking for same staff on same date
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
