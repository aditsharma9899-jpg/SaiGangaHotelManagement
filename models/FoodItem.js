const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    foodId: { type: String, required: true, unique: true, index: true }, // e.g. FOOD0001
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true }, // optional: hide item
    category: { type: String, default: "General" }, // optional
    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
