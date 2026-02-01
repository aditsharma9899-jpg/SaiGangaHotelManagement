const express = require("express");
const router = express.Router();
const FoodOrder = require("../models/FoodOrder");

async function generateOrderId() {
  const count = await FoodOrder.countDocuments();
  return "FORD" + String(count + 1).padStart(4, "0");
}

// POST /newapi/food-orders  (create walk-in or booking food order)
router.post("/", async (req, res) => {
  try {
    const {
      type = "Walk-in",
      bookingId = "",
      customerName = "",
      mobile = "",
      items = []
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "No food items selected" });
    }

    // calculate totals safely (server-side)
    const safeItems = items.map((i) => {
      const price = Number(i.price || 0);
      const quantity = Number(i.quantity || 0);
      const total = price * quantity;

      return {
        foodId: i.foodId || "",
        name: i.name || "",
        price,
        quantity,
        total
      };
    });

    const totalAmount = safeItems.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    const orderId = await generateOrderId();
    const date = new Date().toLocaleDateString("en-GB");
    const time = new Date().toLocaleTimeString();

    const created = await FoodOrder.create({
      orderId,
      type,
      bookingId,
      customerName,
      mobile,
      items: safeItems,
      totalAmount,
      status: "Completed",
      date,
      time
    });

    res.json({ success: true, order: created });
  } catch (err) {
    console.error("❌ Food order create error:", err);
    res.status(500).json({ success: false, error: "Failed to create food order" });
  }
});

module.exports = router;
