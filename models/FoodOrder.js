const mongoose = require("mongoose");

const foodOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true }, // FORD0001
    type: { type: String, default: "Walk-in" }, // Walk-in / Booking
    bookingId: { type: String, default: "" },   // optional when linked to booking

    customerName: { type: String, default: "" }, // optional
    mobile: { type: String, default: "" },       // optional

    items: [
      {
        foodId: { type: String, default: "" },   // FOOD0001
        name: { type: String, default: "" },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        total: { type: Number, default: 0 }
      }
    ],

    totalAmount: { type: Number, default: 0 },
    status: { type: String, default: "Completed" }, // Completed/Cancelled

    date: { type: String, default: "" }, // en-GB date
    time: { type: String, default: "" }, // time

    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodOrder", foodOrderSchema);
