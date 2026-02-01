const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true, index: true }, // STAFF0001
    name: { type: String, required: true, trim: true, index: true },
    mobile: { type: String, default: "", trim: true, index: true },
    position: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    joinDate: { type: String, default: "" }, // keep as string (same as your UI)
    status: { type: String, default: "Active" }, // Active/Inactive

    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
