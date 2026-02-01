const express = require("express");
const ExcelJS = require("exceljs");

const Staff = require("../models/Staff");
const Customer = require("../models/Customer");
const FoodItem = require("../models/FoodItem");
       // if your model name is FoodItem, change it
const Booking = require("../models/Booking");
const Payment = require("../models/Payments");
const Attendance = require("../models/Attendance");

const router = express.Router();

function setDownloadHeaders(res, filename) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
}

router.get("/:type", async (req, res) => {
  try {
    const type = (req.params.type || "").toLowerCase();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");

    let rows = [];
    let filename = `${type}.xlsx`;

    // ===================== STAFF =====================
    if (type === "staff") {
      const items = await Staff.find().sort({ createdAt: -1 }).lean();
      sheet.columns = [
        { header: "Staff ID", key: "staffId", width: 14 },
        { header: "Name", key: "name", width: 20 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "Position", key: "position", width: 18 },
        { header: "Salary", key: "salary", width: 10 },
        { header: "Join Date", key: "joinDate", width: 12 },
        { header: "Status", key: "status", width: 10 },
      ];
      rows = items.map(s => ({
        staffId: s.staffId,
        name: s.name,
        mobile: s.mobile,
        position: s.position,
        salary: s.salary,
        joinDate: s.joinDate,
        status: s.status || "Active",
      }));
      filename = "staff.xlsx";
    }

    // ===================== CUSTOMERS =====================
    else if (type === "customers") {
      const items = await Customer.find().sort({ createdAt: -1 }).lean();
      sheet.columns = [
        { header: "Customer ID", key: "customerId", width: 14 },
        { header: "Name", key: "name", width: 20 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "Total Bookings", key: "totalBookings", width: 14 },
      ];
      rows = items.map(c => ({
        customerId: c.customerId,
        name: c.name,
        mobile: c.mobile,
        address: c.address,
        totalBookings: c.totalBookings,
      }));
      filename = "customers.xlsx";
    }

    // ===================== FOODS =====================
    else if (type === "foods") {
  const items = await FoodItem.find().sort({ createdAt: -1 }).lean();

  sheet.columns = [
    { header: "Food ID", key: "foodId", width: 12 },
    { header: "Name", key: "name", width: 25 },
    { header: "Price", key: "price", width: 10 },
    { header: "Category", key: "category", width: 16 },
    { header: "Available", key: "isAvailable", width: 12 },
  ];

  rows = items.map(f => ({
    foodId: f.foodId,
    name: f.name,
    price: f.price,
    category: f.category || "General",
    isAvailable: f.isAvailable ? "Yes" : "No",
  }));

  filename = "foods.xlsx";
}


    // ===================== BOOKINGS =====================
    else if (type === "bookings") {
      const items = await Booking.find().sort({ createdAt: -1 }).lean();
      sheet.columns = [
        { header: "Booking ID", key: "bookingId", width: 12 },
        { header: "Customer", key: "customerName", width: 18 },
        { header: "Mobile", key: "mobile", width: 14 },
        { header: "Rooms", key: "roomNumbers", width: 20 },
        { header: "Check In", key: "checkInDate", width: 12 },
        { header: "Check Out", key: "checkOutDate", width: 12 },
        { header: "Status", key: "status", width: 12 },
        { header: "Total", key: "totalAmount", width: 10 },
        { header: "Advance", key: "advance", width: 10 },
        { header: "Balance", key: "balance", width: 10 },
      ];
      rows = items.map(b => {
  const raw = b.raw || {};

  const checkInDate =
    b.checkInDate ||
    raw.checkInDate ||
    raw["Check In"] ||
    "";

  const checkOutDate =
    b.checkOutDate ||
    raw.checkOutDate ||
    raw["Check Out"] ||
    "";

  const status =
    b.status ||
    raw.status ||
    raw["Status"] ||
    "";

  const roomNumbers =
    (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0)
      ? b.roomNumbers.join(", ")
      : (raw.roomNumbers || raw["Room Number"] || "");

  const totalAmount =
    Number(b.totalAmount ?? raw.totalAmount ?? raw["Total Amount"] ?? 0);

  const advance =
    Number(b.advance ?? raw.advance ?? raw.advanceAmount ?? raw["Advance"] ?? 0);

  const balance =
    Number(b.balance ?? raw.balance ?? raw["Balance"] ?? (totalAmount - advance));

  return {
    bookingId: b.bookingId || raw.bookingId || raw["Booking ID"] || "",
    customerName: b.customerName || raw.customerName || raw["Customer Name"] || "",
    mobile: b.mobile || raw.mobile || raw["Mobile"] || "",
    roomNumbers,
    checkInDate,
    checkOutDate,
    status,
    totalAmount,
    advance,
    balance,
  };
});

      filename = "bookings.xlsx";
    }

    // ===================== PAYMENTS =====================
    else if (type === "payments") {
      const items = await Payment.find().sort({ createdAt: -1 }).lean();
      sheet.columns = [
        { header: "Payment ID", key: "paymentId", width: 12 },
        { header: "Booking ID", key: "bookingId", width: 12 },
        { header: "Customer", key: "customerName", width: 18 },
        { header: "Amount", key: "amount", width: 10 },
        { header: "Mode", key: "paymentMode", width: 12 },
        { header: "Date", key: "date", width: 12 },
        { header: "Time", key: "time", width: 12 },
      ];
      rows = items.map(p => ({
        paymentId: p.paymentId,
        bookingId: p.bookingId,
        customerName: p.customerName,
        amount: p.amount,
        paymentMode: p.paymentMode,
        date: p.date,
        time: p.time,
      }));
      filename = "payments.xlsx";
    }

    // ===================== ATTENDANCE =====================
    else if (type === "attendance") {
      const items = await Attendance.find().sort({ createdAt: -1 }).lean();
      sheet.columns = [
        { header: "Attendance ID", key: "attendanceId", width: 14 },
        { header: "Staff ID", key: "staffId", width: 12 },
        { header: "Staff Name", key: "staffName", width: 18 },
        { header: "Date", key: "date", width: 12 },
        { header: "Time", key: "time", width: 12 },
        { header: "Status", key: "status", width: 10 },
      ];
      rows = items.map(a => ({
        attendanceId: a.attendanceId,
        staffId: a.staffId,
        staffName: a.staffName,
        date: a.date,
        time: a.time,
        status: a.status,
      }));
      filename = "attendance.xlsx";
    }

    else {
      return res.status(400).json({ success: false, error: "Invalid export type" });
    }

    sheet.addRows(rows);

    // simple header style
    sheet.getRow(1).font = { bold: true };

    setDownloadHeaders(res, filename);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ export error:", err);
    res.status(500).json({ success: false, error: "Failed to export excel" });
  }
});

module.exports = router;
