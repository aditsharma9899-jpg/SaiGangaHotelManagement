const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// ✅ GET /newapi/customers
router.get("/", async (req, res) => {
  try {
    const docs = await Customer.find().sort({ createdAt: -1 });
    res.json(docs.map(d => d.raw));
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch customers" });
  }
});

// ✅ GET /newapi/customers/:id   (id = CUST0001)
router.get("/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const doc = await Customer.findOne({ customerId });

    if (!doc) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    res.json({ success: true, customer: doc.raw });
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    res.status(500).json({ success: false, error: "Failed to fetch customer" });
  }
});

// ✅ POST /newapi/customers
router.post("/", async (req, res) => {
  try {
    const raw = req.body || {};

    const customerId = raw["Customer ID"] || raw.customerId;
    const name = raw["Name"] || raw.name || "";
    const mobile = raw["Mobile"] || raw.mobile || "";
    const address = raw["Address"] || raw.address || "";
    const totalBookings = Number(raw["Total Bookings"] || raw.totalBookings || 0);
    const documents = raw["documents"] || raw.documents || [];

    if (!customerId) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }

    await Customer.findOneAndUpdate(
      { customerId },
      {
        customerId,
        name,
        mobile,
        address,
        totalBookings,
        documents,
        raw: {
          ...raw,
          "Customer ID": customerId,
          "Name": name,
          "Mobile": mobile,
          "Address": address,
          "Total Bookings": totalBookings,
          "documents": documents
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error adding customer:", error);
    res.status(500).json({ success: false, error: "Failed to add customer" });
  }
});

// ✅ PUT /newapi/customers/:id  (update documents / address / etc.)
router.put("/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const body = req.body || {};

    const existing = await Customer.findOne({ customerId });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    // merge documents safely
    const newDocs = Array.isArray(body.documents) ? body.documents : null;
    const mergedDocs = newDocs ? newDocs : (existing.documents || []);

    const name = body.name ?? existing.name;
    const mobile = body.mobile ?? existing.mobile;
    const address = body.address ?? existing.address;
    const totalBookings = body.totalBookings ?? existing.totalBookings;

    const updated = await Customer.findOneAndUpdate(
      { customerId },
      {
        name,
        mobile,
        address,
        totalBookings,
        documents: mergedDocs,
        raw: {
          ...(existing.raw || {}),
          ...(body.raw || {}),
          "Customer ID": customerId,
          "Name": name,
          "Mobile": mobile,
          "Address": address,
          "Total Bookings": Number(totalBookings || 0),
          "documents": mergedDocs
        }
      },
      { new: true }
    );

    res.json({ success: true, customer: updated.raw });
  } catch (error) {
    console.error("❌ Error updating customer:", error);
    res.status(500).json({ success: false, error: "Failed to update customer" });
  }
});

// ✅ DELETE /newapi/customers/:id
router.delete("/:id", async (req, res) => {
  try {
    const customerId = req.params.id;

    const result = await Customer.deleteOne({ customerId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting customer:", error);
    res.status(500).json({ success: false, error: "Failed to delete customer" });
  }
});

module.exports = router;
