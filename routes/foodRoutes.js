const express = require("express");
const router = express.Router();
const seedFoodItems = require("../seed/foodSeedData");
const FoodItem = require("../models/FoodItem");

// helper: generate FOOD0001, FOOD0002...
async function generateFoodId() {
  const count = await FoodItem.countDocuments();
  return "FOOD" + String(count + 1).padStart(4, "0");
}

/**
 * GET /newapi/food
 * List all food items (admin + customer view)
 */
router.get("/", async (req, res) => {
  try {
    const items = await FoodItem.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ GET food error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * POST /newapi/food
 * Add new food item
 */
router.post("/", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const price = Number(req.body.price || 0);
    const category = (req.body.category || "General").trim();
    const isAvailable = req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : true;

    if (!name) return res.status(400).json({ success: false, error: "Name is required" });
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, error: "Invalid price" });
    }

    const foodId = await generateFoodId();

    const created = await FoodItem.create({
      foodId,
      name,
      price,
      category,
      isAvailable
    });

    res.json({ success: true, item: created });
  } catch (err) {
    console.error("❌ POST food error:", err);

    // duplicate name optional (if you add unique on name)
    res.status(500).json({ success: false, error: "Failed to create food item" });
  }
});

/**
 * PUT /newapi/food/:foodId
 * Update food item
 */
router.put("/:foodId", async (req, res) => {
  try {
    const { foodId } = req.params;

    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.price !== undefined) update.price = Number(req.body.price);
    if (req.body.category !== undefined) update.category = String(req.body.category).trim();
    if (req.body.isAvailable !== undefined) update.isAvailable = Boolean(req.body.isAvailable);

    if (update.name !== undefined && !update.name) {
      return res.status(400).json({ success: false, error: "Name cannot be empty" });
    }
    if (update.price !== undefined && (Number.isNaN(update.price) || update.price < 0)) {
      return res.status(400).json({ success: false, error: "Invalid price" });
    }

    const updated = await FoodItem.findOneAndUpdate(
      { foodId },
      { $set: update },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, error: "Food item not found" });

    res.json({ success: true, item: updated });
  } catch (err) {
    console.error("❌ PUT food error:", err);
    res.status(500).json({ success: false, error: "Failed to update food item" });
  }
});

/**
 * DELETE /newapi/food/:foodId
 * Delete food item
 */
router.delete("/:foodId", async (req, res) => {
  try {
    const { foodId } = req.params;
    const deleted = await FoodItem.findOneAndDelete({ foodId });

    if (!deleted) return res.status(404).json({ success: false, error: "Food item not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE food error:", err);
    res.status(500).json({ success: false, error: "Failed to delete food item" });
  }
});




router.post("/seed", async (req, res) => {
  try {
    // ✅ prevents duplicate insertion
    const existingCount = await FoodItem.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `Food already seeded (${existingCount} items exist).`,
        inserted: 0
      });
    }

    await FoodItem.insertMany(seedFoodItems);

    return res.json({
      success: true,
      message: "Food seeded successfully!",
      inserted: seedFoodItems.length
    });
  } catch (err) {
    console.error("❌ Food seed error:", err);
    return res.status(500).json({ success: false, error: "Failed to seed food items" });
  }
});
module.exports = router;
