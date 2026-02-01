const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Customer = require("../models/Customer");

// multer memory storage (no local uploads folder needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// helper: upload buffer to cloudinary
function uploadBufferToCloudinary(buffer, folder, fileName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: fileName ? fileName.replace(/\.[^/.]+$/, "") : undefined, // remove extension
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ✅ POST /newapi/customerDocuments/upload
router.post("/upload", upload.array("documents", 20), async (req, res) => {
  try {
    const { customerId, bookingId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: "customerId required" });
    }

    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ success: true, documents: [] });
    }

    const uploadedDocs = [];

    for (const file of req.files) {
      // your frontend renames files like: p1_front_filename.png
      const originalName = file.originalname || "";
      const match = originalName.match(/^p(\d+)_(front|back)_(.+)$/i);

      const personIndex = match ? Number(match[1]) : 1;
      const side = match ? match[2].toLowerCase() : "";
      const realName = match ? match[3] : originalName;

      // upload to cloudinary
      const folder = `hotel_docs/${customerId}/${bookingId || "no_booking"}`;
      const cloudRes = await uploadBufferToCloudinary(file.buffer, folder, originalName);

      uploadedDocs.push({
        bookingId: bookingId || "",
        personIndex,
        side,
        docType: "Aadhar",
        originalName: realName,
        publicId: cloudRes.public_id,
        url: cloudRes.secure_url,
        uploadedAt: new Date(),
      });
    }

    // ✅ push into documents array
    customer.documents = [...(customer.documents || []), ...uploadedDocs];

    // keep raw documents also if you want
    customer.raw = {
      ...(customer.raw || {}),
      documents: customer.documents,
    };

    await customer.save();

    res.json({ success: true, documents: uploadedDocs });
  } catch (err) {
    console.error("❌ document upload error:", err);
    res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
});

module.exports = router;
