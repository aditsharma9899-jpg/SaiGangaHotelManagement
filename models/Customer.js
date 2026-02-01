const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "", trim: true },
    mobile: { type: String, default: "", trim: true, index: true },
    address: { type: String, default: "" },
    totalBookings: { type: Number, default: 0 },
    documents: [
  {
    bookingId: { type: String, default: "" },
    personIndex: { type: Number, default: 1 }, // 1,2,3...
    side: { type: String, default: "" }, // "front" / "back"
    docType: { type: String, default: "Aadhar" },

    originalName: { type: String, default: "" },
    publicId: { type: String, default: "" },
    url: { type: String, default: "" },

    uploadedAt: { type: Date, default: Date.now },
  }
],

    // keep original excel-style object
    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
