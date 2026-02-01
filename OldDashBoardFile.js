// ==================== CONFIGURATION & HELPER FUNCTIONS ====================

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/newapi'
    : '/api';

const rooms = { first: [], second: [], third: [] };
const HOTEL_ADDRESS = `ADDRESS: NAGAR, SHRIDI ROAD, GUHA, TALUKA RAHURI,
DIST: AHILYANAGAR, STATE: MAHARASHTRA, PINCODE: 413706`;


const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1bfzwqGH20vhZi3PxpMhQglDg_aHsmZes';
var bookinglength

let filteredFoodItems = [];
let bookings = [], customers = [], payments = [], staff = [], attendance = [];
let attendanceData = {};
let currentAttendanceMonth = new Date();
let currentAttendanceView = 'calendar';
let selectedRooms = [];
let foodOrder = {}, bookingCounter = 1, currentTheme = 'light';
let currentBookingForFood = null;
let currentEditingFoodItem = null;


// ==================== HELPER FUNCTIONS ====================

function toISODateKeyFromGB(gbDate) {
  // "DD/MM/YYYY" -> "YYYY-MM-DD"
  if (!gbDate || !gbDate.includes("/")) return "";
  const [dd, mm, yyyy] = gbDate.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function toGBDateFromISO(isoDate) {
  // "YYYY-MM-DD" -> "DD/MM/YYYY"
  if (!isoDate || !isoDate.includes("-")) return "";
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${dd}/${mm}/${yyyy}`;
}


function getList(json) {
  // backend may return array OR object: {success:true, items:[...]} etc.
  if (Array.isArray(json)) return json;
  return json.items || json.data || json.rooms || json.bookings || json.customers || json.payments || json.attendance || json.staff || [];
}

function normalizeRoom(r) {
  return {
    floor: String(r.floor || "").toLowerCase(),
    roomNumber: String(r.roomNumber || ""),
    status: String(r.status || "available").toLowerCase(), // available/occupied
    price: Number(r.price || 0),
    type: r.type || "",
  };
}


function normalizeBooking(b) {
  return {
    bookingId: b.bookingId || "",
    customerName: b.customerName || "",
    mobile: b.mobile || "",
    roomNumbers: Array.isArray(b.roomNumbers) ? b.roomNumbers.map(String) : [],
    status: b.status || "",

    checkInDate: b.checkInDate || "",
    checkInTime: b.checkInTime || "",
    checkOutDate: b.checkOutDate || "",

    nights: Number(b.nights || 1),
    roomPricePerNight: Number(b.roomPricePerNight || 0),
    roomAmount: Number(b.roomAmount || 0),
    additionalAmount: Number(b.additionalAmount || 0),
    totalAmount: Number(b.totalAmount || 0),

    advance: Number(b.advance || 0),
    balance: Number(b.balance || 0),

    raw: b.raw || {},
    createdAt: b.createdAt,
  };
}

function normalizeCustomer(c) {
  return {
    customerId: c.customerId || "",
    name: c.name || "",
    mobile: c.mobile || "",
    address: c.address || "",
    totalBookings: Number(c.totalBookings || 0),
    documents: Array.isArray(c.documents) ? c.documents : [],
    raw: c.raw || {},
  };
}

function normalizePayment(p) {
  return {
    paymentId: p.paymentId || p["Payment ID"] || "",
    bookingId: p.bookingId || p["Booking ID"] || "",
    customerName: p.customerName || p["Customer Name"] || "",
    amount: Number(p.amount ?? p["Amount"] ?? 0),
    paymentMode: p.paymentMode || p["Payment Mode"] || "",
    date: p.date || p["Date"] || "",
    time: p.time || p["Time"] || "",
    raw: p.raw || {}
  };
}


function normalizeAttendance(a) {
  return {
    attendanceId: a.attendanceId || "",
    staffId: a.staffId || "",
    staffName: a.staffName || "",
    date: a.date || "",
    time: a.time || "",
    status: a.status || "Present",
    raw: a.raw || {},
  };
}


async function loadFoodItemsFromServer() {
  try {
    const res = await fetch(`${API_URL}/food`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.error || "Failed to load food");

    // Make it match your existing UI usage
    foodItems = data.items.map((x) => ({
      id: x.foodId,              // IMPORTANT: keep id as foodId string
      name: x.name,
      price: Number(x.price || 0),
      isAvailable: x.isAvailable !== false,
      category: x.category || "General",
    }));

    filteredFoodItems = [...foodItems];
  } catch (err) {
    console.error("❌ loadFoodItemsFromServer:", err);
    foodItems = [];
    filteredFoodItems = [];
  }
}


function saveFoodItems() {
    localStorage.setItem('hotelFoodItems', JSON.stringify(foodItems));
}

function loadAttendanceData() {
    const saved = localStorage.getItem('hotelAttendanceCalendar');
    if (saved) {
        attendanceData = JSON.parse(saved);
    }
}

function saveAttendanceData() {
    localStorage.setItem('hotelAttendanceCalendar', JSON.stringify(attendanceData));
}

function toggleTheme() {
    const body = document.body, themeIcon = document.getElementById('themeIcon');
    if (currentTheme === 'light') {
        body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.textContent = '☀️';
        currentTheme = 'dark';
    }
}

function renderDocsRows(numPersons) {
  const container = document.getElementById("docsContainer");
  if (!container) return;

  const n = Math.max(1, Number(numPersons || 1));

  let html = `
    <div style="margin: 20px 0; padding: 20px; border: 2px dashed #3498db; border-radius: 8px; background: #f0f8ff;">
      <h3 style="margin-bottom: 15px; color: #2c3e50;">📎 Upload Documents</h3>
  `;

  for (let i = 1; i <= n; i++) {
    html += `
      <div class="form-row">
        <div class="form-group">
          <label>Person ${i} - Aadhar Front</label>
          <input type="file"
            data-doc="1" data-person="${i}" data-side="front"
            accept="image/*,.pdf"
            onchange="displayFileNameForDynamic(this)"
          />
          <small class="fileName" style="display:block;margin-top:5px;color:#27ae60;"></small>
        </div>

        <div class="form-group">
          <label>Person ${i} - Aadhar Back</label>
          <input type="file"
            data-doc="1" data-person="${i}" data-side="back"
            accept="image/*,.pdf"
            onchange="displayFileNameForDynamic(this)"
          />
          <small class="fileName" style="display:block;margin-top:5px;color:#27ae60;"></small>
        </div>
      </div>
    `;
  }

  html += `
      <small style="display:block;margin-top:10px;color:#666;text-align:center;">
        📄 Accepted formats: Images (JPG, PNG) or PDF | Max size per file: 5MB
      </small>
    </div>
  `;

  container.innerHTML = html;
}

function displayFileNameForDynamic(input) {
  const small = input.parentElement.querySelector(".fileName");
  if (!small) return;

  const file = input.files && input.files[0];
  if (!file) return;

  const fileSize = (file.size / 1024 / 1024).toFixed(2);
  if (file.size > 5 * 1024 * 1024) {
    small.textContent = "❌ File too large (max 5MB)";
    small.style.color = "#e74c3c";
    input.value = "";
    return;
  }

  small.textContent = `✅ ${file.name} (${fileSize} MB)`;
  small.style.color = "#27ae60";
}


function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 1;
    
    let start, end;
    
    if (checkIn.includes('/')) {
        const parts = checkIn.split('/');
        start = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        start = new Date(checkIn);
    }
    
    if (checkOut.includes('/')) {
        const parts = checkOut.split('/');
        end = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        end = new Date(checkOut);
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// ==================== DOCUMENT MANAGEMENT ====================

function displayFileName(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (file.size > 5 * 1024 * 1024) {
            display.textContent = '❌ File too large (max 5MB)';
            display.style.color = '#e74c3c';
            input.value = '';
            return;
        }
        
        display.textContent = `✅ ${file.name} (${fileSize} MB)`;
        display.style.color = '#27ae60';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function uploadDocuments(customerId, bookingId) {
  const fileInputs = Array.from(document.querySelectorAll("input[type='file'][data-doc]"));

  const formData = new FormData();
  formData.append("customerId", customerId);
  formData.append("bookingId", bookingId);

  let count = 0;

  for (const input of fileInputs) {
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Rename file so backend can detect p1_front etc.
      // We store personIndex + side in filename
      const personIndex = input.getAttribute("data-person") || "1";
      const side = input.getAttribute("data-side") || "front";

      const newName = `p${personIndex}_${side}_${file.name}`;
      const renamedFile = new File([file], newName, { type: file.type });

      formData.append("documents", renamedFile);
      count++;
    }
  }

  if (count === 0) return [];

  const res = await fetch(`${API_URL}/customerDocuments/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");

  return data.documents || [];
}

// ✅ FIX: View documents with download option
async function viewCustomerDocuments(customerId) {
  try {
    const customer = customers.find(c => String(c.customerId) === String(customerId));

    if (!customer) {
      alert("❌ Customer not found. Please reload data.");
      return;
    }

    const docs = Array.isArray(customer.documents) ? customer.documents : [];

    if (docs.length === 0) {
      alert("📄 No documents uploaded for this customer.");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal active";

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 750px;">
        <div class="modal-header">
          <h2>📄 Customer Documents</h2>
          <span class="close-btn" onclick="this.closest('.modal').remove()">×</span>
        </div>

        <div style="margin: 20px 0;">
          <p><strong>Customer:</strong> ${customer.name || "-"}</p>
          <p><strong>Mobile:</strong> ${customer.mobile || "-"}</p>

          <h3 style="margin-top: 20px;">Uploaded Documents:</h3>

          <div style="max-height: 420px; overflow-y: auto;">
            ${docs.map((doc, i) => {
              const url = doc.url || doc.secure_url || doc.cloudinaryUrl || "";
              const name = doc.originalName || doc.filename || doc.publicId || `Document ${i + 1}`;
              const uploadedAt = doc.uploadedAt || doc.uploadDate || doc.createdAt;

              const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url) || (doc.mimeType || "").startsWith("image/");

              return `
                <div style="padding: 12px; margin: 10px 0; background: #f8f9fa; border-radius: 8px;">
                  <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                    <div>
                      <strong>${i + 1}. ${name}</strong><br>
                      <small style="color:#666;">
                        ${uploadedAt ? `Uploaded: ${new Date(uploadedAt).toLocaleString()}` : ""}
                      </small>
                    </div>

                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                      <a href="${url}" target="_blank" class="btn btn-primary" style="padding:8px 12px; text-decoration:none;">🔗 Open</a>
                      <a href="${url}" download class="btn btn-success" style="padding:8px 12px; text-decoration:none;">⬇️ Download</a>
                    </div>
                  </div>

                  ${isImage && url ? `
                    <div style="margin-top:10px;">
                      <img src="${url}" alt="${name}" style="width:100%; max-height:260px; object-fit:contain; border-radius:8px; background:white; border:1px solid #eee;">
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

  } catch (error) {
    console.error("Error viewing documents:", error);
    alert("❌ Error loading documents");
  }
}

// ==================== MAIN INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', async function() {
    loadTheme();
    loadFoodItemsFromServer()
    loadAttendanceData();
    await loadAllData();
    initializeFoodMenu();
    renderFoodMenuManager();
    renderAttendanceCalendar();
    
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);
    
    const advanceBookingForm = document.getElementById('advanceBookingForm');
    if (advanceBookingForm) advanceBookingForm.addEventListener('submit', handleAdvanceBookingSubmit);

    const personsInput = document.getElementById("numPersons");
if (personsInput) {
  renderDocsRows(personsInput.value);
  personsInput.addEventListener("input", () => renderDocsRows(personsInput.value));
}
    
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    
    if (checkInDate && checkOutDate) {
        const updateCalculations = () => {
            if (checkInDate.value && checkOutDate.value) {
                const nights = calculateNights(checkInDate.value, checkOutDate.value);
                const numNightsField = document.getElementById('numNights');
                if (numNightsField) {
                    numNightsField.value = nights;
                }
            }
        };
        checkInDate.addEventListener('change', updateCalculations);
        checkOutDate.addEventListener('change', updateCalculations);
    }
});

async function loadAllData() {
  try {
    console.log("📄 Loading data from server...");

    // ===================== ROOMS =====================
    const roomsJson = await (await fetch(`${API_URL}/rooms`)).json();
    const roomList = getList(roomsJson).map(normalizeRoom);
    console.log('room list',roomList)

    rooms.first = roomList
  .filter(r => r.floor === "first")
  .map(r => ({ floor: r.floor, number: r.roomNumber, status: r.status, price: r.price, type: r.type }));

rooms.second = roomList
  .filter(r => r.floor === "second")
  .map(r => ({ floor: r.floor, number: r.roomNumber, status: r.status, price: r.price, type: r.type }));

rooms.third = roomList
  .filter(r => r.floor === "third")
  .map(r => ({ floor: r.floor, number: r.roomNumber, status: r.status, price: r.price, type: r.type }));

    // ===================== BOOKINGS =====================
    const bookingsJson = await (await fetch(`${API_URL}/bookings`)).json();
    bookings = getList(bookingsJson).map(normalizeBooking);

    console.log('bookings',bookings)

    // bookingCounter
    const ids = bookings
      .map(b => b.bookingId)
      .filter(Boolean)
      .map(id => parseInt(String(id).replace("BK", ""), 10))
      .filter(n => !isNaN(n));

    bookingCounter = ids.length ? Math.max(...ids) + 1 : 1;

    // ===================== CUSTOMERS =====================
    const customersJson = await (await fetch(`${API_URL}/customers`)).json();
    customers = getList(customersJson).map(normalizeCustomer);

    // ===================== PAYMENTS =====================
    const paymentsJson = await (await fetch(`${API_URL}/payments`)).json();
    payments = getList(paymentsJson).map(normalizePayment);

    // ===================== STAFF / ATTENDANCE =====================
    const staffJson = await (await fetch(`${API_URL}/staff`)).json();
    staff = (staffJson.items || staffJson || []).map(s => ({
    staffId: s.staffId,
    name: s.name,
    mobile: s.mobile,
    position: s.position,
    salary: s.salary,
    joinDate: s.joinDate
    }));


    console.log('staff data',staff)
     

    const attJson = await (await fetch(`${API_URL}/attendance`)).json();
    attendance = getList(attJson).map(normalizeAttendance);

    console.log("✅ All data loaded successfully");

    updateRoomstatusFromBookings();
    initializeRooms();
    updateDashboard();
    updateAllTables();
    updateStaffTable();
    showRoomStatus()
  } catch (error) {
    console.error("❌ Error loading data:", error);
    alert("⚠️ Server connection failed. Check backend is running.");
  }
}



function updateRoomstatusFromBookings() {
  const confirmed = bookings.filter(b => b.status === "Confirmed");

  confirmed.forEach(b => {
    (b.roomNumbers || []).forEach(roomNum => {
      for (let floor in rooms) {
        const room = rooms[floor].find(r => String(r.number) === String(roomNum));
        if (room) room.status = "occupied"; // ✅ lowercase
      }
    });
  });
}



function initializeRooms() {6
    renderRoomBoxes('firstFloor', rooms.first);
    renderRoomBoxes('secondFloor', rooms.second);
    renderRoomBoxes('thirdFloor', rooms.third);
    renderRoomstatus();
}

function renderRoomBoxes(containerId, roomList) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  roomList.forEach(room => {
    const box = document.createElement("div");

    const statusClass = String(room.status || "available").toLowerCase();
    box.className = `room-box ${statusClass}`;

    // ✅ FIX: room.number (not room.numbers)
    box.innerHTML = `${room.number}<br><small>${room.type || ""}</small>`;

    if (statusClass === "available") {
      box.onclick = () => selectRoom(room, box);
    }

    container.appendChild(box);
  });
}
function showRoomStatus() {
  const container = document.getElementById("roomStatusContainer");
  if (!container) return;

  const floors = [
    { key: "first", title: "First Floor", list: rooms.first },
    { key: "second", title: "Second Floor", list: rooms.second },
    { key: "third", title: "Third Floor", list: rooms.third },
  ];

  let html = `
    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <h2>🛏️ Room Status (Admin)</h2>
          <div style="font-size:12px;color:#7f8c8d;">Add / Edit / Delete rooms</div>
        </div>
        <button class="btn btn-success" onclick="openAddRoomModal()">+ Add Room</button>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin:15px 0;flex-wrap:wrap;">
        <span class="badge" style="background:#2ecc71;color:white;">available</span>
        <span class="badge" style="background:#e74c3c;color:white;">occupied</span>
      </div>
  `;

  floors.forEach(f => {
    const list = Array.isArray(f.list) ? f.list : [];
    html += `<h3 style="margin:15px 0 8px;color:#2c3e50;">${f.title}</h3>`;
    html += `<div class="room-selector" style="display:flex;flex-wrap:wrap;gap:10px;">`;

    if (list.length === 0) {
      html += `<div style="color:#7f8c8d;padding:10px;">No rooms</div>`;
    } else {
      list.forEach(r => {
        const number = r.number;     // from loadAllData mapping
        const type = r.type || "";
        const status = String(r.status || "available").toLowerCase();
        const price = Number(r.price || 0);

        html += `
          <div class="room-box ${status}" style="cursor:default; min-width:110px;">
            <div style="font-weight:800;font-size:16px;">${number}</div>
            <small>${type || "-"}</small><br/>
           
            <small style="text-transform:capitalize;">${status}</small>

            <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;">
              <button class="action-btn btn-warning" style="padding:4px 8px;font-size:10px;"
                onclick="openEditRoomModal('${number}')">✏️</button>

              <button class="action-btn btn-danger" style="padding:4px 8px;font-size:10px;"
                onclick="deleteRoom('${number}', '${status}')">🗑️</button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  });

  html += `
    </div>

    <!-- Modal -->
    <div id="roomModal" class="modal">
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
          <h2 id="roomModalTitle">Add Room</h2>
          <span class="close-btn" onclick="closeRoomModal()">×</span>
        </div>

        <form onsubmit="return handleRoomSubmit(event)">
          <input type="hidden" id="roomMode" value="add" />

          <div class="form-group">
            <label>Room Number *</label>
            <input type="text" id="roomNumberInput" required />
          </div>

          <div class="form-group">
            <label>Floor</label>
            <select id="roomFloorInput">
              <option value="first">first</option>
              <option value="second">second</option>
              <option value="third">third</option>
            </select>
          </div>

          <div class="form-group">
            <label>Type</label>
            <input type="text" id="roomTypeInput" placeholder="Non AC / AC" />
          </div>

          <div class="form-group">
            <label>Price</label>
            <input type="number" id="roomPriceInput" min="0" value="0" />
          </div>

          <div class="form-group">
            <label>Status</label>
            <select id="roomStatusInput">
              <option value="available">available</option>
              <option value="occupied">occupied</option>
            </select>
          </div>

          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
            <button type="button" class="btn btn-danger" onclick="closeRoomModal()">Cancel</button>
            <button type="submit" class="btn btn-success">✅ Save</button>
          </div>
        </form>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/* ---------- MODAL OPEN/CLOSE ---------- */
function openAddRoomModal() {
  document.getElementById("roomModalTitle").textContent = "Add Room";
  document.getElementById("roomMode").value = "add";

  const num = document.getElementById("roomNumberInput");
  num.value = "";
  num.disabled = false;

  document.getElementById("roomFloorInput").value = "first";
  document.getElementById("roomTypeInput").value = "";
  document.getElementById("roomPriceInput").value = 0;
  document.getElementById("roomStatusInput").value = "available";

  document.getElementById("roomModal").classList.add("active");
}

function openEditRoomModal(roomNumber) {
  // find from UI rooms object
  const all = [...rooms.first, ...rooms.second, ...rooms.third];
  const r = all.find(x => String(x.number) === String(roomNumber));
  if (!r) return alert("Room not found, reload data");

  document.getElementById("roomModalTitle").textContent = "Edit Room";
  document.getElementById("roomMode").value = "edit";

  const num = document.getElementById("roomNumberInput");
  num.value = r.number;
  num.disabled = true;

  document.getElementById("roomFloorInput").value = (r.floor || "first");
  document.getElementById("roomTypeInput").value = r.type || "";
  document.getElementById("roomPriceInput").value = Number(r.price || 0);
  document.getElementById("roomStatusInput").value = String(r.status || "available").toLowerCase();

  document.getElementById("roomModal").classList.add("active");
}

function closeRoomModal() {
  const m = document.getElementById("roomModal");
  if (m) m.classList.remove("active");
}

/* ---------- SAVE ---------- */
async function handleRoomSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById("roomMode").value; // add/edit
  const roomNumber = document.getElementById("roomNumberInput").value.trim();

  const payload = {
    roomNumber,
    floor: document.getElementById("roomFloorInput").value,
    type: document.getElementById("roomTypeInput").value,
    price: Number(document.getElementById("roomPriceInput").value || 0),
    status: document.getElementById("roomStatusInput").value,
  };

  if (!payload.roomNumber) return alert("Room number required");

  try {
    let res;

    if (mode === "add") {
      res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_URL}/rooms/${encodeURIComponent(roomNumber)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Save failed");

    alert(mode === "add" ? "✅ Room added!" : "✅ Room updated!");
    closeRoomModal();

    await loadAllData();
    showRoomStatus();

  } catch (err) {
    console.error("❌ handleRoomSubmit:", err);
    alert("❌ " + err.message);
  }

  return false;
}

/* ---------- DELETE ---------- */
async function deleteRoom(roomNumber, status) {
  if (String(status).toLowerCase() === "occupied") {
    alert("⚠️ This room is occupied. Checkout booking first or mark it available then delete.");
    return;
  }

  if (!confirm(`Delete room ${roomNumber}?`)) return;

  try {
    const res = await fetch(`${API_URL}/rooms/${encodeURIComponent(roomNumber)}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");

    alert("✅ Room deleted!");
    await loadAllData();
    showRoomStatus();

  } catch (err) {
    console.error("❌ deleteRoom:", err);
    alert("❌ " + err.message);
  }
}




function selectRoom(room, boxElement) {
    const index = selectedRooms.findIndex(r => r.number === room.number);
    
    if (index !== -1) {
        selectedRooms.splice(index, 1);
        boxElement.classList.remove('selected');
    } else {
        selectedRooms.push(room);
        boxElement.classList.add('selected');
    }
    
    updateSelectedRoomsList();
}

function updateSelectedRoomsList() {
    const listElement = document.getElementById('selectedRoomsList');
    if (!listElement) return;
    
    if (selectedRooms.length === 0) {
        listElement.textContent = 'None';
        listElement.style.color = '#e74c3c';
    } else {
        listElement.textContent = selectedRooms.map(r => `${r.number} (${r.type})`).join(', ');
        listElement.style.color = '#27ae60';
    }
}

function renderRoomstatus() {
    const container = document.getElementById('roomsstatus');
    if (!container) return;
    let html = '';
    const floors = [
        { name: 'First Floor', rooms: rooms.first },
        { name: 'Second Floor', rooms: rooms.second },
        { name: 'Third Floor', rooms: rooms.third }
    ];


    
    floors.forEach(floor => {
        html += `<div class="floor-section"><div class="floor-title">${floor.name}</div><div class="room-selector">`;
        floor.rooms.forEach(room => {
            html += `<div class="room-box ${room.status}">${room.number}<br><small>${room.type}</small><br><small style="text-transform: capitalize;">${room.status}</small></div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function updateRoomstatus(roomNumbers, status) {
    roomNumbers.forEach(roomNum => {
        for (let floor in rooms) {
            const room = rooms[floor].find(r => r.number === roomNum);
            if (room) {
                room.status = status;
            }
        }
    });
    initializeRooms();
}

function showSection(sectionId, event) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (sectionId === 'attendanceCalendar') {
        renderAttendanceCalendar();
    }
    if (sectionId === "roomStatus") {
  showRoomStatus();
}
    
    if (sectionId === 'food' && !currentBookingForFood) {
        const addFoodBtn = document.querySelector('#food .btn-success');
        if (addFoodBtn) {
            addFoodBtn.textContent = 'Create Food Order (Walk-in)';
            addFoodBtn.onclick = createFoodOrder;
        }
    }
}



console.log('✅ Dashboard Part 3 (Init) loaded');
// ==================== BOOKING SUBMISSION ====================

function downloadCustomerPDF(customerId) {
  window.open(`${API_URL}/customerDocuments/${encodeURIComponent(customerId)}/pdf`, "_blank");
}


async function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (selectedRooms.length === 0) {
        alert('Please select at least one room!');
        return false;
    }

    const checkInDate = document.getElementById('checkInDate')?.value;
    const checkOutDate = document.getElementById('checkOutDate')?.value;
    
    if (!checkOutDate) {
        alert('Please select check-out date');
        return false;
    }

    const manualNights = parseInt(document.getElementById('numNights')?.value || 1);
    const roomAmountPerNight = parseInt(document.getElementById('roomAmount')?.value || 0);
    
    const totalRoomAmount = roomAmountPerNight * manualNights;
    
    const additionalAmount = parseInt(document.getElementById('additionalAmount')?.value || 0);
    const advancePayment = parseInt(document.getElementById('advancePayment')?.value || 0);
    const customerName = document.getElementById('cust1')?.value;
    const mobile = document.getElementById('mobile1')?.value||''
        const grandTotal = totalRoomAmount + additionalAmount
    const balance = grandTotal - advancePayment;
    console.log('customer name',customerName)
    console.log('mobile',mobile)
    
    console.log('💰 Booking Calculation:');
    console.log(`  Nights: ${manualNights}`);
    console.log(`  Room Amount Per Night: ₹${roomAmountPerNight}`);
    console.log(`  Total Room Amount (${roomAmountPerNight} × ${manualNights}): ₹${totalRoomAmount}`);
    console.log(`  Additional Amount: ₹${additionalAmount}`);
    console.log(`  Grand Total: ₹${grandTotal}`);
    console.log(`  Advance: ₹${advancePayment}`);
    console.log(`  Balance: ₹${balance}`);
    
    const customerId = 'CUST' + String(customers.length + 1).padStart(4, '0');
    const bookingId = 'BK' + String(bookingCounter).padStart(4, '0');

    await fetch(`${API_URL}/customers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customerId,
    name: customerName,
    mobile,
    address: document.getElementById("address")?.value || "",
    totalBookings: 1,
    documents: [],
    raw: {}
  }),
});

 const bookingData = {
            'Booking ID': bookingId,
            'Customer Name': document.getElementById('cust1')?.value || '',
            'Mobile': document.getElementById('mobile1')?.value || '',
            'Address': document.getElementById('address')?.value,
            'Sr Number': document.getElementById('srNumber')?.value || 'N/A',
            'No. of Persons': document.getElementById('numPersons')?.value,
            'Room Number': selectedRooms.map(r => r.number).join(', '),
            'Room Type': selectedRooms.map(r => r.type).join(', '),
            'Check In': checkInDate,
            'Check In Time': document.getElementById('checkInTime')?.value,
            'Check Out': checkOutDate,
            'Nights': manualNights,
            'Room Price Per Night': roomAmountPerNight,
            'Room Amount': totalRoomAmount,
            'Additional Amount': additionalAmount,
            'Total Amount': grandTotal,
            'Payment Mode': document.getElementById('paymentMode')?.value,
            'Advance': advancePayment,
            'Balance': balance,
            'status': 'Confirmed',
            'Date': new Date().toLocaleDateString('en-GB'),
            'Time': new Date().toLocaleTimeString(),
            'Note': document.getElementById('note')?.value || '',
            'Food Orders': []
        };
        
        console.log()
        console.log('📤 Sending booking to server:', bookingData);
        
        const mongoBookingData = {
  bookingId,
  customerName: document.getElementById("cust1")?.value || "",
  mobile: document.getElementById("mobile1")?.value || "",

  roomNumbers: selectedRooms.map(r => String(r.number)),  // ✅ REQUIRED for your schema

  checkInDate,
  checkInTime: document.getElementById("checkInTime")?.value || "",
  checkOutDate,
  nights: manualNights,

  roomPricePerNight: roomAmountPerNight,
  roomAmount: totalRoomAmount,
  additionalAmount,
  totalAmount: grandTotal,

  paymentMode: document.getElementById("paymentMode")?.value || "",
  advance: advancePayment,
  balance,

  status: "Confirmed",
  raw: {},

  // if your booking schema does not include documents, remove these from backend or add them to raw
};


console.log('📤 Sending MongoDB booking:', mongoBookingData);

const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mongoBookingData)
});
        
        const result = await response.json();
        console.log('📥 Server response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to create booking');
        }
        
       
        
        if (advancePayment > 0) {
  await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: "PAY" + String(payments.length + 1).padStart(4, "0"),
      bookingId,
      customerName,
      amount: advancePayment,
      paymentMode: document.getElementById("paymentMode")?.value || "",
      date: new Date().toLocaleDateString("en-GB"),
      time: new Date().toLocaleTimeString(),
      raw: { note: "Advance payment" }
    }),
  });
}
    
    try {
        const submitBtn =
  e.submitter ||
  e.target.querySelector('button[type="submit"], input[type="submit"]');

if (submitBtn) {
  submitBtn.textContent = "⏳ Creating booking...";
  submitBtn.disabled = true;
}
     
        
        const uploadedDocs = await uploadDocuments(customerId, bookingId);
        
       

        
        bookingCounter++;
        
        const docsMessage = uploadedDocs && uploadedDocs.length > 0 
            ? `\n📄 ${uploadedDocs.length} document(s) ready for Google Drive` 
            : '';
        
        alert(
            `✅ Booking created successfully!${docsMessage}\n\n` +
            `📋 Booking ID: ${bookingId}\n` +
            `👤 Customer: ${customerName}\n` +
            `🏠 Rooms: ${bookingData['Room Number']}\n` +
            `🌙 Nights: ${manualNights}\n` +
            `💵 Rate: ₹${roomAmountPerNight}/night\n` +
            `🏨 Room Total: ₹${totalRoomAmount}\n` +
            `➕ Additional: ₹${additionalAmount}\n` +
            `💰 Grand Total: ₹${grandTotal}\n` +
            `✅ Advance Paid: ₹${advancePayment}\n` +
            `⚠️ Balance: ₹${balance}`
        );
        
        printInvoice(bookingId);
        
        e.target.reset();
        
        ['file1Name', 'file2Name', 'file3Name', 'file4Name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '';
        });
        
        selectedRooms = [];
        document.querySelectorAll('.room-box').forEach(box => box.classList.remove('selected'));
        updateSelectedRoomsList();
        
        await loadAllData();
        
        submitBtn.textContent = '✅ Create Booking & Generate Invoice';
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        alert('❌ Failed to create booking: ' + error.message);
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = '✅ Create Booking & Generate Invoice';
        submitBtn.disabled = false;
    }
    
    return false;
}

// ==================== ADVANCE BOOKING ====================

async function handleAdvanceBookingSubmit(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('advCustomerName')?.value;
    const mobile = document.getElementById('advMobileNumber')?.value;
    const checkInDate = document.getElementById('advCheckInDate')?.value;
    const checkOutDate = document.getElementById('advCheckOutDate')?.value;
    const numPersons = document.getElementById('advNumPersons')?.value;
    const checkInTime = document.getElementById('advCheckInTime')?.value;
    const totalAmount = parseInt(document.getElementById('advTotalAmount')?.value || 0);
    const advanceAmount = parseInt(document.getElementById('advAdvanceAmount')?.value || 0);
    const note = document.getElementById('advNote')?.value;
    
    const bookingId = 'BK' + String(bookingCounter).padStart(4, '0');
    const customerId = 'CUST' + String(customers.length + 1).padStart(4, '0');
    
    const bookingData = {
  bookingId,
  customerName,
  mobile,
  roomNumbers: [],                 // TBD
  status: "Advance Booking",

  checkInDate,
  checkInTime,
  checkOutDate,

  nights: calculateNights(checkInDate, checkOutDate),
  roomPricePerNight: 0,
  roomAmount: 0,
  additionalAmount: 0,

  totalAmount,
  advance: advanceAmount,
  balance: totalAmount - advanceAmount,

  raw: { numPersons, note }
};


    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Failed to create advance booking');
        }
        
        await fetch(`${API_URL}/customers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customerId,
    name: customerName,
    mobile,
    address: "",
    totalBookings: 1,
    documents: [],
    raw: {}
  })
});
        
        await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'Payment ID': 'PAY' + String(payments.length + 1).padStart(4, '0'),
                'Booking ID': bookingId,
                'Customer Name': customerName,
                'Amount': advanceAmount,
                'Payment Mode': 'cash',
                'Date': bookingData['Date'],
                'Time': bookingData['Time']
            })
        });
        
        bookingCounter++;
        
        alert(`✅ Advance Booking created!\n\n📋 Booking ID: ${bookingId}\nRoom will be allocated on check-in.`);
        
        e.target.reset();
        await loadAllData();
        
    } catch (error) {
        console.error('❌ Advance booking error:', error);
        alert('❌ Failed to create advance booking');
    }
    
    return false;
}
// ==================== DASHBOARD UPDATES ====================

function updateDashboard() {
    const totalRooms = rooms.first.length + rooms.second.length + rooms.third.length;
    document.getElementById('totalRooms').textContent = totalRooms;
    
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    document.getElementById('bookingCount').textContent = confirmedBookings;
    
    let availableCount = Object.values(rooms).reduce((sum, floor) => 
        sum + floor.filter(r => r.status === 'available').length, 0
    );
    document.getElementById('availableCount').textContent = availableCount;
    
    const today = new Date().toLocaleDateString('en-GB');

const revenueToday = payments
  .filter(p => p.date === today)   // payment date
  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

document.getElementById('revenueToday').textContent = '₹' + revenueToday;

console.log(`💰 Today's Revenue (${today}): ₹${revenueToday}`);

    
  const pendingAmount = bookings.reduce((sum, b) => {
  const bookingPayments = payments.filter(p => p.bookingId === b.bookingId);
  const paid = bookingPayments.reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0
  );

  const total = Number(b.totalAmount || 0);
  const balance = total - paid;

  return sum + (balance > 0 ? balance : 0);
}, 0);

document.getElementById('pendingAmount').textContent = '₹' + pendingAmount;

console.log(`⚠️ Pending Amount: ₹${pendingAmount}`);

   console.log('bookings',bookings)
    
    let advanceBookings = bookings.filter(b => b.status === 'Advance Booking').length;
    document.getElementById('advanceBookings').textContent = advanceBookings;
    
    const recentTable = document.getElementById('recentBookingsTable');
    if (recentTable && bookings.length > 0) {
        const recentBookings = bookings.filter(b => b.status === 'Confirmed').slice(-5).reverse();
        if (recentBookings.length > 0) {
            recentTable.innerHTML = `<table><thead><tr><th>Booking ID</th><th>Customer</th><th>Room</th><th>Check-in</th><th>Nights</th><th>Total</th><th>status</th></tr></thead><tbody>
                ${recentBookings.map(b => {
                    const nights = Number(b.nights || calculateNights(b.checkInDate, b.checkOutDate));
                    return `<tr><td>${b['bookingId']}</td><td>${b['customerName']}</td><td>${b['roomNumbers']}</td><td>${b['checkInDate']}</td><td>${nights}</td><td>₹${b['totalAmount']}</td><td><span class="badge badge-success">${b.status}</span></td></tr>`;
                }).join('')}</tbody></table>`;
        } else {
            recentTable.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px;">No confirmed bookings yet</p>';
        }
    }
}

// ==================== FOOD MENU FUNCTIONS ====================

function searchFoodMenu() {
    const searchInput = document.getElementById('foodSearch');
    if (!searchInput) return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    filteredFoodItems = !searchTerm ? [...foodItems] : foodItems.filter(item => item.name.toLowerCase().includes(searchTerm));
    initializeFoodMenu();
}

function initializeFoodMenu() {
    const foodMenu = document.getElementById('foodMenu');
    foodMenu.innerHTML = '';

    filteredFoodItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'food-item';

        div.innerHTML = `
            <h4>${item.name}</h4>
            <div class="price">₹${item.price}</div>
            <div class="quantity-control">
                <button onclick="updateFoodQty('${item.id}', -1)">-</button>
                <span id="qty-${item.id}">${foodOrder[item.id] || 0}</span>
                <button onclick="updateFoodQty('${item.id}', 1)">+</button>
            </div>
        `;
        foodMenu.appendChild(div);
    });
}


function updateFoodQty(itemId, change) {
    if (!foodOrder[itemId]) foodOrder[itemId] = 0;
    foodOrder[itemId] = Math.max(0, foodOrder[itemId] + change);
    const qtyEl = document.getElementById(`qty-${itemId}`);
    if (qtyEl) qtyEl.textContent = foodOrder[itemId];
    updateFoodTotal();
}

function updateFoodTotal() {
    let total = 0;
    for (let itemId in foodOrder) {
        const item = foodItems.find(i => i.id == itemId);
        if (item && item.price) total += item.price * foodOrder[itemId];
    }
    const totalEl = document.getElementById('foodTotal');
    if (totalEl) totalEl.textContent = total;
}

async function createFoodOrder() {
  let orderItems = [];
  let totalAmount = 0;

  // foodOrder object: { FOOD0001: 2, FOOD0005: 1 }
  for (let foodId in foodOrder) {
    const qty = Number(foodOrder[foodId] || 0);
    if (qty <= 0) continue;

    const item = foodItems.find(i => String(i.id) === String(foodId));
    if (!item) continue;

    const price = Number(item.price || 0);
    const total = price * qty;

    orderItems.push({
      foodId: String(item.id),   // FOOD0001
      name: item.name,
      price,
      quantity: qty,
      total
    });

    totalAmount += total;
  }

  if (orderItems.length === 0) {
    alert("Please select at least one food item");
    return;
  }

  try {
    // ✅ Save to MongoDB
    const res = await fetch(`${API_URL}/food-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Walk-in",
        items: orderItems
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to create food order");
    }

    const savedOrder = data.order;

    // ✅ Invoice object from server (orderId + date/time)
    const foodInvoice = {
      type: "Food Order (Walk-in)",
      id: savedOrder.orderId,
      items: savedOrder.items,
      totalAmount: savedOrder.totalAmount,
      date: savedOrder.date,
      time: savedOrder.time
    };

    printFoodInvoice(foodInvoice);
    alert(`✅ Food order saved!\n\n📋 Order ID: ${savedOrder.orderId}\n💰 Total: ₹${savedOrder.totalAmount}`);

    // ✅ reset UI
    foodOrder = {};
    filteredFoodItems = [...foodItems];

    const searchInput = document.getElementById("foodSearch");
    if (searchInput) searchInput.value = "";

    initializeFoodMenu();
    updateFoodTotal();

  } catch (err) {
    console.error("❌ createFoodOrder error:", err);
    alert("❌ Failed to create food order: " + err.message);
  }
}

// ==================== FOOD MENU MANAGER ====================

function renderFoodMenuManager() {
    const container = document.getElementById('foodMenuManager');
    if (!container) return;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-success" onclick="openAddFoodItemModal()">+ Add New Item</button>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Item Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
    
    foodItems.forEach(item => {
        html += `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>
                    <button class="action-btn btn-warning" onclick="editFoodItem('${item.id}')">✏️ Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteFoodItem('${item.id}')">🗑️ Delete</button>
                </td>
            </tr>`;
    });
    
    html += `</tbody></table></div>`;
    
    html += `
        <div id="foodItemModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="foodModalTitle">Add Food Item</h2>
                    <span class="close-btn" onclick="closeFoodItemModal()">×</span>
                </div>
                <form id="foodItemForm" onsubmit="return handleFoodItemSubmit(event)">
                    <input type="hidden" id="foodItemId">
                    
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="foodItemName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Price *</label>
                        <input type="number" id="foodItemPrice" required min="1">
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-success">✅ Save Item</button>
                        <button type="button" class="btn btn-danger" onclick="closeFoodItemModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function openAddFoodItemModal() {
    document.getElementById('foodModalTitle').textContent = 'Add Food Item';
    document.getElementById('foodItemForm').reset();
    document.getElementById('foodItemId').value = '';
    currentEditingFoodItem = null;
    document.getElementById('foodItemModal').classList.add('active');
}

function editFoodItem(foodId) {
  const item = foodItems.find(i => i.id === foodId);
  if (!item) return;

  document.getElementById('foodModalTitle').textContent = 'Edit Food Item';
  document.getElementById('foodItemId').value = item.id; // FOOD0001
  document.getElementById('foodItemName').value = item.name;
  document.getElementById('foodItemPrice').value = item.price;

  document.getElementById('foodItemModal').classList.add('active');
}


async function deleteFoodItem(foodId) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    const res = await fetch(`${API_URL}/food/${encodeURIComponent(foodId)}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");

    alert("✅ Food item deleted successfully!");

    await loadFoodItemsFromServer();
    filteredFoodItems = [...foodItems];
    renderFoodMenuManager();
    initializeFoodMenu();

  } catch (err) {
    console.error("❌ deleteFoodItem:", err);
    alert("❌ Failed: " + err.message);
  }
}


async function handleFoodItemSubmit(e) {
  e.preventDefault();

  const foodId = document.getElementById("foodItemId")?.value?.trim(); // will hold FOOD0001 when editing
  const itemName = document.getElementById("foodItemName")?.value?.trim();
  const itemPrice = Number(document.getElementById("foodItemPrice")?.value || 0);

  if (!itemName) {
    alert("❌ Please enter item name");
    return false;
  }
  if (Number.isNaN(itemPrice) || itemPrice <= 0) {
    alert("❌ Please enter valid price");
    return false;
  }

  try {
    // ✅ EDIT
    if (foodId) {
      const res = await fetch(`${API_URL}/food/${encodeURIComponent(foodId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName, price: itemPrice })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");

      alert("✅ Food item updated successfully!");
    }
    // ✅ ADD
    else {
      const res = await fetch(`${API_URL}/food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName, price: itemPrice })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Create failed");

      alert("✅ Food item added successfully!");
    }

    // ✅ refresh UI from server
    await loadFoodItemsFromServer();
    filteredFoodItems = [...foodItems];
    renderFoodMenuManager();
    initializeFoodMenu();
    closeFoodItemModal();

  } catch (err) {
    console.error("❌ handleFoodItemSubmit:", err);
    alert("❌ Failed: " + err.message);
  }

  return false;
}


function closeFoodItemModal() {
    document.getElementById('foodItemModal').classList.remove('active');
}

function openFoodMenuForBooking(bookingId) {
    currentBookingForFood = bookingId;
    const booking = bookings.find(b => b.bookingId === bookingId);
    
    if (!booking) {
        alert('Booking not found');
        return;
    }
    
    foodOrder = {};
    filteredFoodItems = [...foodItems];
    initializeFoodMenu();
    updateFoodTotal();
    
    showSection('food');
    
    const addFoodBtn = document.querySelector('#food .btn-success');
    if (addFoodBtn) {
        addFoodBtn.textContent = `Add Food to Booking ${bookingId}`;
        addFoodBtn.onclick = async function() {
            let hasItems = false, orderItems = [], totalAmount = 0;
            for (let id in foodOrder) {
                if (foodOrder[id] > 0) {
                    hasItems = true;
                    const item = foodItems.find(i => i.id == id);
                    if (item && item.price) {
                        orderItems.push({ 
                            name: item.name, 
                            quantity: foodOrder[id], 
                            price: item.price, 
                            total: item.price * foodOrder[id] 
                        });
                        totalAmount += item.price * foodOrder[id];
                    }
                }
            }
            
            if (!hasItems) {
                alert('Please select at least one food item');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/bookings/${bookingId}/add-food`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        foodItems: orderItems,
                        foodTotal: totalAmount
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ Food order added!\n\nTotal: ₹${totalAmount}\n\nThis amount has been added to the booking.`);
                    foodOrder = {};
                    currentBookingForFood = null;
                    await loadAllData();
                    showSection('bookings');
                } else {
                    alert('❌ Failed to add food order');
                }
            } catch (error) {
                console.error('Error adding food:', error);
                alert('❌ Error adding food order');
            }
        };
    }
}

function showSection(sectionId, event) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (sectionId === 'attendanceCalendar') {
        renderAttendanceCalendar();
    }
    
    if (sectionId === 'food' && !currentBookingForFood) {
        const addFoodBtn = document.querySelector('#food .btn-success');
        if (addFoodBtn) {
            addFoodBtn.textContent = 'Create Food Order (Walk-in)';
            addFoodBtn.onclick = createFoodOrder;
        }
    }
}
// ==================== TABLE UPDATES ====================

function updateAllTables() {
  /* ===================== BOOKINGS TABLE ===================== */
  const allBookingsTable = document.getElementById("allBookingsTable");
  if (allBookingsTable) {
    const list = bookings.filter(
      (b) =>
        b.status === "Confirmed" ||
        b.status === "Cancelled" ||
        b.status === "Advance Booking"
    );

    if (list.length === 0) {
      allBookingsTable.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:#7f8c8d;">No bookings yet</td></tr>';
    }
    else {
      allBookingsTable.innerHTML = list
        .map((b) => {
          const bookingId = b.bookingId || "";
          const nights = Number(b.nights || 1);

          const roomPricePerNight = Number(b.roomPricePerNight || 0);
          const roomAmount =
            Number(b.roomAmount || 0) || roomPricePerNight * nights;

          const additionalAmount = Number(b.additionalAmount || 0);
          const totalAmount =
            Number(b.totalAmount || 0) || roomAmount + additionalAmount;

          // ✅ payments based on bookingId
          const bookingPayments = payments.filter((p) => p.bookingId === bookingId);
          const totalPaid = bookingPayments.reduce(
            (sum, p) => sum + (Number(p.amount) || 0),
            0
          );

          const currentBalance = totalAmount - totalPaid;
          const hasBalance = currentBalance > 0;
          const isConfirmed = b.status === "Confirmed";

          const roomNumbers = Array.isArray(b.roomNumbers)
            ? b.roomNumbers.join(", ")
            : "TBD";

          const badgeClass =
            b.status === "Cancelled"
              ? "danger"
              : b.status === "Checked Out"
              ? "info"
              : b.status === "Advance Booking"
              ? "warning"
              : "success";

          return `<tr>
            <td>${bookingId}</td>

            <td>
              ${b.customerName || ""}
              <br><small style="color:#7f8c8d;">${b.mobile || ""}</small>
            </td>

            <td>${roomNumbers || "TBD"}</td>

            <td>
              ${b.checkInDate || ""}
              <br><small style="color:#27ae60;">${b.checkInTime || "N/A"}</small>
            </td>

            <td>${b.checkOutDate || "Not set"}</td>

            <td>${nights} ${nights === 1 ? "night" : "nights"}</td>

            <td>
              ₹${roomPricePerNight}/night
              <br><small style="color:#7f8c8d;">Total: ₹${roomAmount}</small>
            </td>

            <td>₹${totalAmount}</td>

            <td>
              <span class="badge badge-${badgeClass}">${b.status || "-"}</span>
              ${
                hasBalance
                  ? `<br><span class="badge badge-warning" style="margin-top:5px;">Balance: ₹${currentBalance}</span>`
                  : ""
              }
            </td>

            <td>
              <div class="action-buttons">

                ${
                  isConfirmed
                    ? `
                  <button class="action-btn btn-primary" onclick="openFoodMenuForBooking('${bookingId}')">🍽️ Food</button>
                  <button class="action-btn btn-warning" onclick="openEditBookingModal('${bookingId}')">✏️ Edit</button>
                `
                    : ""
                }

                ${
                  hasBalance
                    ? `
                  <button class="action-btn btn-info" onclick="openPaymentModal('${bookingId}')"
                    style="background:#f39c12;border:2px solid #e67e22;font-weight:bold;">
                    💰 Payment
                  </button>
                `
                    : ""
                }

                ${
                  isConfirmed
                    ? `
                  <button class="action-btn btn-danger" onclick="checkoutBooking('${bookingId}')">📤 Checkout</button>
                `
                    : ""
                }

                <button class="action-btn btn-success" onclick="printInvoice('${bookingId}')">🖨️ Print</button>
                <button class="action-btn btn-whatsapp" onclick="shareWhatsApp('${bookingId}')">📱 Share</button>
                <button class="action-btn btn-danger" onclick="deleteBooking('${bookingId}')">🗑️ Delete</button>

              </div>
            </td>
          </tr>`;
        })
        .join("");
    }
  }

  /* ===================== CUSTOMERS TABLE ===================== */
  const customersTable = document.getElementById("customersTable");

  console.log('customersdata',customers)
  if (customersTable) {
    if (!customers || customers.length === 0) {
      customersTable.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#7f8c8d;">No customers yet</td></tr>';
    } else {
      customersTable.innerHTML = customers
        .map((c) => {
          const docCount = Array.isArray(c.documents) ? c.documents.length : 0;

          return `
            <tr>
              <td>${c.customerId || ""}</td>
              <td>${c.name || ""}</td>
              <td>${c.mobile || ""}</td>
              <td>${c.address || ""}</td>
              <td>${c.totalBookings ?? 0}</td>
              <td>
                ${
                  docCount > 0
                    ? `<button class="btn btn-info" onclick="viewCustomerDocuments('${c.customerId}')"
                          style="background:#3498db;padding:8px 12px;">
                        📁 View (${docCount})
                       </button>`
                    : `<span style="color:#95a5a6;">No documents</span>`
                }
              </td>
              <td>
                <button class="action-btn btn-danger" onclick="deleteCustomer('${c.customerId}')">🗑️ Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");
    }
  }

  /* ===================== PAYMENTS TABLE ===================== */
  const paymentsTable = document.getElementById("paymentsTable");
  if (paymentsTable) {
    if (!payments || payments.length === 0) {
      paymentsTable.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:#7f8c8d;">No payments yet</td></tr>';
    } else {
      paymentsTable.innerHTML = payments
        .map((p) => {
          return `
            <tr>
              <td>${p.paymentId || ""}</td>
              <td>${p.bookingId || ""}</td>
              <td>${p.customerName || ""}</td>
              <td>₹${Number(p.amount || 0)}</td>
              <td>${p.paymentMode || ""}</td>
              <td>${p.date || ""}</td>
              <td><span class="badge badge-success">Completed</span></td>
              <td>
                <button class="action-btn btn-danger" onclick="deletePayment('${p.paymentId}')">🗑️ Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");
    }
  }

  /* ===================== ADVANCE BOOKINGS TABLE ===================== */
  const advanceBookingsTable = document.getElementById("advanceBookingsTable");
  if (advanceBookingsTable) {
    const adv = bookings.filter((b) => b.status === "Advance Booking");
    console.log('adv',adv)

    if (adv.length === 0) {
      advanceBookingsTable.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:#7f8c8d;">No advance bookings yet</td></tr>';
    } else {
      advanceBookingsTable.innerHTML = adv
        .map((b) => {
          return `
            <tr>
              <td>${b.bookingId || ""}</td>
              <td>${b.customerName || ""}</td>
              <td>${b.mobile || ""}</td>
              <td>${b.checkInDate || ""}</td>
              <td>${b.checkOutDate || ""}</td>
              <td>${b.nights ?? 1}</td>
              <td>₹${Number(b.totalAmount || 0)}</td>
              <td>₹${Number(b.advance || 0)}</td>
              <td><span class="badge badge-warning">Advance</span></td>
              <td>
                <button class="action-btn btn-danger" onclick="deleteBooking('${b.bookingId}')">🗑️ Delete</button>
              </td>
            </tr>
          `;
        })
        .join("");
    }
  }
}


function updateCustomersTableWithDocs() {
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        if (customers.length > 0) {
            customersTable.innerHTML = customers.map(c => {
                const docCount = c.documents ? c.documents.length : 0;
                return `
                    <tr>
                        <td>${c['Customer ID']}</td>
                        <td>${c.Name}</td>
                        <td>${c.Mobile}</td>
                        <td>${c.Address}</td>
                        <td>${c['Total Bookings']}</td>
                        <td>b['Booking ID']
                            ${docCount > 0 ? `
                                <button class="btn btn-info" onclick="viewCustomerDocuments('${c['Customer ID']}')" 
                                        style="background: #3498db; padding: 8px 12px;">
                                    📁 View (${docCount})
                                </button>
                            ` : `
                                <span style="color: #95a5a6;">No documents</span>
                            `}
                        </td>
                        <td>
                            <button class="action-btn btn-danger" onclick="deleteCustomer('${c['Customer ID']}')">
                                🗑️ Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            customersTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7f8c8d;">No customers yet</td></tr>';
        }
    }
}

// ==================== EDIT BOOKING ====================

function openEditBookingModal(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    console.log('edit booking',booking)
    if (!booking) return;
    
    document.getElementById('editBookingId').value = booking.bookingId;
    document.getElementById('editCustomerName').value = booking.customerName;
    document.getElementById('editMobileNumber').value = booking.mobile;
    document.getElementById('editCheckInDate').value = booking.checkInDate;
    document.getElementById('editCheckOutDate').value = booking.checkOutDate;
    document.getElementById('editNights').value = booking.Nights || 1;
    document.getElementById('editRoomAmountPerNight').value = booking['Room Price Per Night'] || 0;
    document.getElementById('editAdditionalAmount').value = booking.aditionalAmount || 0;
    document.getElementById('editNote').value = booking['Note'] || '';
    
    document.getElementById('editBookingModal').classList.add('active');
}

function closeEditBookingModal() {
    document.getElementById('editBookingModal').classList.remove('active');
}

async function handleEditBookingSubmit(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('editBookingId').value;
    const nights = parseInt(document.getElementById('editNights').value);
    const roomPricePerNight = parseInt(document.getElementById('editRoomAmountPerNight').value);
    const additionalAmount = parseInt(document.getElementById('editAdditionalAmount').value || 0);
    
    const roomAmount = roomPricePerNight * nights;
    const totalAmount = roomAmount + additionalAmount;
    
    const booking = bookings.find(b => b.bookingId === bookingId);
    const advance = booking ? booking['Advance'] : 0;
    const balance = totalAmount - advance;
    
    const updatedBooking = {
        ...booking,
        'Customer Name': document.getElementById('editCustomerName').value,
        'Mobile': document.getElementById('editMobileNumber').value,
        'Check In': document.getElementById('editCheckInDate').value,
        'Check Out': document.getElementById('editCheckOutDate').value,
        'Nights': nights,
        'Room Price Per Night': roomPricePerNight,
        'Room Amount': roomAmount,
        'Additional Amount': additionalAmount,
        'Total Amount': totalAmount,
        'Balance': balance,
        'Note': document.getElementById('editNote').value
    };
    
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBooking)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Booking updated successfully!');
            closeEditBookingModal();
            await loadAllData();
        } else {
            alert('❌ Failed to update booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('❌ Error updating booking');
    }
    
    return false;
}

// ==================== PAYMENT MODAL ====================

function openPaymentModal(bookingId) {
  const booking = bookings.find(b => b.bookingId === bookingId);
  if (!booking) return;

  const bookingPayments = payments.filter(p => p.bookingId === bookingId);
  const totalPaid = bookingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalAmount = Number(booking.totalAmount || 0);
  const currentBalance = totalAmount - totalPaid;

  document.getElementById('paymentBookingId').value = booking.bookingId;
  document.getElementById('paymentCustomerName').textContent = booking.customerName;
  document.getElementById('paymentRoomNumber').textContent = (booking.roomNumbers || []).join(", ");
  document.getElementById('paymentBalance').textContent = currentBalance;

  document.getElementById('paymentModal').classList.add('active');
}


function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.getElementById('paymentForm').reset();
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('paymentBookingId').value;
    const paymentAmount = parseInt(document.getElementById('paymentAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentNote = document.getElementById('paymentNote').value;
    
    const booking = bookings.find(b => b.bookingId === bookingId);
    
    if (!booking) {
        alert('Booking not found');
        return false;
    }
    
    if (paymentAmount > booking.balance) {
        alert('⚠️ Payment amount cannot exceed balance due!');
        return false;
    }
    
    try {
        const paymentData = {
  paymentId: "PAY" + String(payments.length + 1).padStart(4, "0"),
  bookingId,
  customerName: booking.customerName,
  amount: paymentAmount,
  paymentMode: paymentMethod,
  date: new Date().toLocaleDateString("en-GB"),
  time: new Date().toLocaleTimeString("en-GB"),
  raw: { note: paymentNote, type: "Partial Payment" }
};
        
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const newBalance = booking.balance - paymentAmount;
            alert(
                `✅ Payment recorded successfully!\n\n` +
                `💰 Amount Paid: ₹${paymentAmount}\n` +
                `📊 New Balance: ₹${newBalance}`
            );
            
            closePaymentModal();
            await loadAllData();
        } else {
            alert('❌ Failed to record payment');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('❌ Error recording payment');
    }
    
    return false;
}
// ==================== DELETE FUNCTIONS ====================

async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Booking deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete booking');
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Customer deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete customer');
    }
}

async function deletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Payment deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete payment');
    }
}

// ==================== CHECKOUT ====================
async function checkoutBooking(bookingId) {
  const booking = bookings.find(b => b.bookingId === bookingId);
  if (!booking) {
    alert("Booking not found");
    return;
  }

  // ✅ Calculate real balance using payments (not booking.balance field)
  const bookingPayments = payments.filter(p => p.bookingId === bookingId);
  const totalPaid = bookingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAmount = Number(booking.totalAmount || 0);
  const currentBalance = totalAmount - totalPaid;

  const confirmMsg =
    currentBalance > 0
      ? `Checkout booking ${bookingId}?\n\n⚠️ Pending Balance: ₹${currentBalance}\nPayment can be collected later.`
      : `Checkout booking ${bookingId}?\n\n✅ Fully paid.`;

  if (!confirm(confirmMsg)) return;

  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectedNow: 0,               // if you later want to collect at checkout
        paymentMode: "",               // optional
        note: "Checked out from dashboard"
      })
    });

    const result = await response.json();

    console.log('check out data',result)

    if (!response.ok || result.success === false) {
      throw new Error(result.error || "Checkout failed");
    }

    alert(
      `✅ Checkout completed!\n\n` +
      `🕐 Check-out Time: ${result.checkoutTime}\n` +
      `⚠️ Pending Balance: ₹${result.booking['balance']}\n\n` +
      `💡 Use "💰 Payment" button to collect remaining amount.`
    );

    await loadAllData();
  } catch (error) {
    console.error("❌ Checkout error:", error);
    alert("❌ Failed to checkout: " + error.message);
  }
}


// ==================== STAFF MANAGEMENT ====================

function updateStaffTable() {
  const staffTable = document.getElementById("staffTable");
  if (!staffTable) return;

  if (!Array.isArray(staff) || staff.length === 0) {
    staffTable.innerHTML =
      '<tr><td colspan="8" style="text-align:center; color:#7f8c8d;">No staff members yet.</td></tr>';
    return;
  }

  const todayGB = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY

  staffTable.innerHTML = staff
    .map((s) => {
      const staffId = s.staffId || "-";

      // ✅ find today's attendance (Mongo fields)
      const todayAttendance = Array.isArray(attendance)
        ? attendance.find(a => a.staffId === staffId && a.date === todayGB)
        : null;

      const attendanceStatusHTML = todayAttendance
        ? `<span class="badge badge-${todayAttendance.status === "Present" ? "success" : "danger"}">${todayAttendance.status}</span>`
        : `<span class="badge" style="background:#95a5a6; color:white;">Not Marked</span>`;

      return `
        <tr>
          <td>${staffId}</td>
          <td>${s.name || "-"}</td>
          <td>${s.mobile || "-"}</td>
          <td>${s.position || "-"}</td>
          <td>₹${Number(s.salary || 0)}</td>
          <td>${s.joinDate || "-"}</td>
          <td>
            ${attendanceStatusHTML}
            <div style="margin-top: 5px;">
              <button class="action-btn btn-success"
                onclick="markAttendance('${staffId}', 'Present')"
                style="padding: 4px 8px; font-size: 10px;">P</button>

              <button class="action-btn btn-danger"
                onclick="markAttendance('${staffId}', 'Absent')"
                style="padding: 4px 8px; font-size: 10px;">A</button>
            </div>
          </td>
          <td>
            <button class="action-btn btn-warning" onclick="openEditStaffModal('${staffId}')">✏️ Edit</button>
            <button class="action-btn btn-danger" onclick="deleteStaff('${staffId}')">🗑️ Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // ✅ Attendance History Table (Mongo)
  const attendanceTable = document.getElementById("attendanceTable");
  if (attendanceTable) {
    if (!Array.isArray(attendance) || attendance.length === 0) {
      attendanceTable.innerHTML =
        '<tr><td colspan="6" style="text-align:center; color:#7f8c8d;">No attendance records yet</td></tr>';
    } else {
      attendanceTable.innerHTML = attendance
        .map((a) => `
          <tr>
            <td>${a.attendanceId || "-"}</td>
            <td>${a.staffId || "-"}</td>
            <td>${a.staffName || "-"}</td>
            <td>${a.date || "-"}</td>
            <td>${a.time || "-"}</td>
            <td><span class="badge badge-${a.status === "Present" ? "success" : "danger"}">${a.status}</span></td>
          </tr>
        `)
        .join("");
    }
  }
}


function openAddStaffModal() {
    document.getElementById('staffModalTitle').textContent = 'Add New Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffModal').classList.add('active');
}

function openEditStaffModal(staffId) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    document.getElementById('staffModalTitle').textContent = 'Edit Staff';
    document.getElementById('staffId').value = staffMember['Staff ID'];
    document.getElementById('staffName').value = staffMember.Name;
    document.getElementById('staffMobile').value = staffMember.Mobile;
    document.getElementById('staffPosition').value = staffMember.Position;
    document.getElementById('staffSalary').value = staffMember.Salary;
    document.getElementById('staffJoinDate').value = staffMember['Join Date'];
    
    document.getElementById('staffModal').classList.add('active');
}

function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('active');
}

async function handleStaffSubmit(e) {
  e.preventDefault();

  const staffId = document.getElementById("staffId").value.trim(); // STAFF0001 if editing

  const payload = {
    name: document.getElementById("staffName").value.trim(),
    mobile: document.getElementById("staffMobile").value.trim(),
    position: document.getElementById("staffPosition").value.trim(),
    salary: Number(document.getElementById("staffSalary").value || 0),
    joinDate: document.getElementById("staffJoinDate").value || ""
  };


  console.log('staff data',payload)

  if (!payload.name) {
    alert("❌ Staff name is required");
    return false;
  }

  try {
    let res;

    // ✅ EDIT
    if (staffId) {
      res = await fetch(`${API_URL}/staff/${encodeURIComponent(staffId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    // ✅ ADD
    else {
      res = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to save staff");

    alert(staffId ? "✅ Staff updated successfully!" : "✅ Staff added successfully!");

    closeStaffModal();
    await loadAllData();
  } catch (err) {
    console.error("❌ handleStaffSubmit:", err);
    alert("❌ Error: " + err.message);
  }

  return false;
}


async function deleteStaff(staffId) {
  if (!confirm("Are you sure you want to delete this staff member?")) return;

  try {
    const res = await fetch(`${API_URL}/staff/${encodeURIComponent(staffId)}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");

    alert("✅ Staff deleted successfully!");
    await loadAllData();
  } catch (err) {
    console.error("❌ deleteStaff:", err);
    alert("❌ Failed: " + err.message);
  }
}


async function markAttendance(staffId, status) {
  const staffMember = staff.find(s => s.staffId === staffId);
  if (!staffMember) {
    alert("❌ Staff not found");
    return;
  }

  const attendancePayload = {
    staffId: staffId,
    staffName: staffMember.name, // optional (backend also fetches)
    date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY
    time: new Date().toLocaleTimeString("en-GB"),
    status: status
  };

  try {
    const response = await fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attendancePayload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to mark attendance");
    }

    alert(`✅ Attendance marked as ${status}${result.updated ? " (updated)" : ""}`);
    await loadAllData(); // reload staff + attendance
  } catch (error) {
    console.error("❌ markAttendance error:", error);
    alert("❌ Failed to mark attendance: " + error.message);
  }
}


// ==================== ATTENDANCE CALENDAR ====================
function renderAttendanceCalendar() {
  const monthDisplay = document.getElementById("attendanceMonthDisplay");
  const calendarView = document.getElementById("attendanceCalendarView");
  const reportView = document.getElementById("attendanceReportView");

  if (!monthDisplay) return;

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const year = currentAttendanceMonth.getFullYear();
  const month = currentAttendanceMonth.getMonth();

  monthDisplay.textContent = `${monthNames[month]} ${year}`;

  if (currentAttendanceView === "calendar") {
    if (calendarView) calendarView.style.display = "block";
    if (reportView) reportView.style.display = "none";
    renderCalendarView(year, month);
  } else {
    if (calendarView) calendarView.style.display = "none";
    if (reportView) reportView.style.display = "block";
    renderReportView(year, month);
  }
}


function renderCalendarView(year, month) {
  const grid = document.getElementById("attendanceGrid");
  if (!grid) return;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `
    <div style="display: grid; grid-template-columns: 150px repeat(${daysInMonth}, 50px); gap: 2px; background: #ecf0f1; padding: 10px; border-radius: 8px; overflow-x: auto;">
      <div style="background: #34495e; color: white; padding: 10px; font-weight: bold; position: sticky; left: 0; z-index: 10;">Staff Name</div>
  `;

  for (let day = 1; day <= daysInMonth; day++) {
    html += `<div style="background:#34495e; color:white; padding:10px; text-align:center; font-weight:bold; min-width:50px;">${day}</div>`;
  }

  if (!Array.isArray(staff) || staff.length === 0) {
    html += `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #7f8c8d; background: white; border-radius: 5px;">No staff members added yet</div>`;
  } else {
    staff.forEach((staffMember) => {
      html += `
        <div style="background:white; padding:10px; font-weight:600; position:sticky; left:0; z-index:5; border-right:2px solid #bdc3c7;">
          ${staffMember.name || "-"}
        </div>
      `;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; // ISO key
        const gbDate = toGBDateFromISO(dateKey); // "DD/MM/YYYY"

        const attendanceRecord = Array.isArray(attendance)
          ? attendance.find((a) => a.staffId === staffMember.staffId && a.date === gbDate)
          : null;

        let bgColor = "#ecf0f1";
        let text = "-";
        let borderColor = "#bdc3c7";

        if (attendanceRecord) {
          if (attendanceRecord.status === "Present") {
            bgColor = "#2ecc71";
            text = "P";
            borderColor = "#27ae60";
          } else if (attendanceRecord.status === "Absent") {
            bgColor = "#e74c3c";
            text = "A";
            borderColor = "#c0392b";
          }
        }

        html += `
          <div style="background:${bgColor}; color:${text === "-" ? "#7f8c8d" : "white"}; padding:10px; text-align:center; font-weight:bold; border:2px solid ${borderColor}; min-width:50px; cursor:pointer;"
            onclick="markAttendanceFromCalendar('${staffMember.staffId}', '${dateKey}')"
            title="Click to mark attendance">${text}</div>
        `;
      }
    });
  }

  html += `</div>`;
  grid.innerHTML = html;
}


function renderReportView(year, month) {
  const reportTable = document.getElementById("attendanceReportTable");
  if (!reportTable) return;

  if (!Array.isArray(staff) || staff.length === 0) {
    reportTable.innerHTML =
      '<tr><td colspan="6" style="text-align:center; color:#7f8c8d;">No staff members added yet</td></tr>';
    return;
  }

  let html = "";

  staff.forEach((staffMember) => {
    const staffAttendance = (Array.isArray(attendance) ? attendance : []).filter((a) => {
      if (a.staffId !== staffMember.staffId) return false;
      const iso = toISODateKeyFromGB(a.date); // "YYYY-MM-DD"
      if (!iso) return false;
      const d = new Date(iso);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const presentDays = staffAttendance.filter((a) => a.status === "Present").length;
    const absentDays = staffAttendance.filter((a) => a.status === "Absent").length;
    const totalMarked = presentDays + absentDays;
    const attendancePercent = totalMarked > 0 ? ((presentDays / totalMarked) * 100).toFixed(1) : "0.0";

    const percentColor =
      Number(attendancePercent) >= 80 ? "#27ae60" :
      Number(attendancePercent) >= 60 ? "#f39c12" : "#e74c3c";

    html += `
      <tr>
        <td>${staffMember.name || "-"}</td>
        <td>${staffMember.position || "-"}</td>
        <td style="color:#27ae60; font-weight:bold;">${presentDays}</td>
        <td style="color:#e74c3c; font-weight:bold;">${absentDays}</td>
        <td>${totalMarked}</td>
        <td style="color:${percentColor}; font-weight:bold; font-size:16px;">${attendancePercent}%</td>
      </tr>
    `;
  });

  reportTable.innerHTML = html || '<tr><td colspan="6" style="text-align:center; color:#7f8c8d;">No attendance data yet</td></tr>';
}


function markAttendanceFromCalendar(staffId, dateKey) {
  const staffMember = staff.find((s) => s.staffId === staffId);
  if (!staffMember) return;

  const dateObj = new Date(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  if (dateObj > today) {
    alert("⚠️ Cannot mark attendance for future dates");
    return;
  }

  const gbDate = toGBDateFromISO(dateKey);

  const existingRecord = (Array.isArray(attendance) ? attendance : []).find(
    (a) => a.staffId === staffId && a.date === gbDate
  );

  if (existingRecord) {
    const changeStatus = confirm(
      `Current status: ${existingRecord.status}\n\nDo you want to change it?\nOK = Present | Cancel = Absent`
    );

    const newStatus = changeStatus ? "Present" : "Absent";

    const updatedRecord = {
      staffId,
      staffName: staffMember.name,
      date: gbDate,
      time: new Date().toLocaleTimeString("en-GB"),
      status: newStatus
    };

    saveAttendanceToServer(updatedRecord);
  } else {
    const status = confirm(
      `Mark attendance for ${staffMember.name}?\n\nOK = Present | Cancel = Absent`
    )
      ? "Present"
      : "Absent";

    const newRecord = {
      staffId,
      staffName: staffMember.name,
      date: gbDate,
      time: new Date().toLocaleTimeString("en-GB"),
      status
    };

    saveAttendanceToServer(newRecord);
  }

  // re-render quickly (UI refresh), API will refresh real data after loadAllData
  renderAttendanceCalendar();
}


async function saveAttendanceToServer(record) {
  try {
    const res = await fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save attendance");
    }

    // reload fresh attendance list from mongo
    await loadAllData();
    renderAttendanceCalendar();
  } catch (error) {
    console.error("❌ Error saving attendance:", error);
    alert("❌ Failed to mark attendance: " + error.message);
  }
}


function previousAttendanceMonth() {
    currentAttendanceMonth.setMonth(currentAttendanceMonth.getMonth() - 1);
    renderAttendanceCalendar();
}

function nextAttendanceMonth() {
    currentAttendanceMonth.setMonth(currentAttendanceMonth.getMonth() + 1);
    renderAttendanceCalendar();
}

function switchAttendanceView(view) {
    currentAttendanceView = view;
    
    const calendarBtn = document.getElementById('calendarViewBtn');
    const reportBtn = document.getElementById('reportViewBtn');
    
    if (view === 'calendar') {
        calendarBtn.style.background = '#3498db';
        calendarBtn.style.color = 'white';
        reportBtn.style.background = '#95a5a6';
        reportBtn.style.color = 'white';
    } else {
        calendarBtn.style.background = '#95a5a6';
        calendarBtn.style.color = 'white';
        reportBtn.style.background = '#3498db';
        reportBtn.style.color = 'white';
    }
    
    renderAttendanceCalendar();
}

// ==================== PRINT INVOICE ====================

function printInvoice(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;
    
    const bookingPayments = payments.filter(p => p['Booking ID'] === bookingId);
    let paymentHistoryHTML = '';
    
    if (bookingPayments.length > 0) {
        const totalPaid = bookingPayments.reduce((sum, p) => sum + parseInt(p.Amount), 0);
        paymentHistoryHTML = `
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px;">
                <h3 style="color: #2e7d32; margin: 0 0 12px 0; font-size: 16px;">💰 Payment History</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: white;">
                    <thead><tr style="background: #4caf50; color: white;">
                        <th style="padding: 8px; text-align: left;">Date</th>
                        <th style="padding: 8px; text-align: left;">Payment ID</th>
                        <th style="padding: 8px; text-align: left;">Mode</th>
                        <th style="padding: 8px; text-align: right;">Amount</th>
                    </tr></thead>
                    <tbody>
                        ${bookingPayments.map((p, idx) => `
                            <tr style="background: ${idx % 2 === 0 ? '#f1f8e9' : 'white'};">
                                <td style="padding: 8px;">${p['Date']}</td>
                                <td style="padding: 8px;">${p['Payment ID']}</td>
                                <td style="padding: 8px; text-transform: uppercase;">${p['Payment Mode']}</td>
                                <td style="padding: 8px; text-align: right; font-weight: bold;">₹${p['Amount']}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #c8e6c9; font-weight: bold;">
                            <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                            <td style="padding: 10px; text-align: right; font-size: 16px;">₹${totalPaid}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    let foodHTML = '';
    if (booking['Food Orders']?.length) {
        foodHTML = booking['Food Orders'].map(i => 
            `<tr><td>${i.name} (x${i.quantity})</td><td style="text-align: right;">₹${i.total}</td></tr>`
        ).join('');
    }
    
    const nights = booking.Nights || calculateNights(booking['Check In'], booking['Check Out']);
    const roomType = booking['Room Type'] || 'N/A';
    const roomAmountPerNight = booking['Room Price Per Night'] || 0;
    const totalRoomAmount = booking['Room Amount'] || (roomAmountPerNight * nights);
    
    // ✅ FIX: Calculate correct balance
    const totalAmount = parseInt(booking['Total Amount']) || 0;
    const bookingPaymentsForBalance = payments.filter(p => p['Booking ID'] === bookingId);
    const totalPaidForBalance = bookingPaymentsForBalance.reduce((sum, p) => sum + parseInt(p.Amount || 0), 0);
    const currentBalance = totalAmount - totalPaidForBalance;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<!DOCTYPE html>
<html><head><title>Invoice - ${booking['Booking ID']}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 15px; max-width: 800px; margin: 0 auto; font-size: 13px; }
.header { text-align: center; margin-bottom: 15px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; }
h1 { margin: 8px 0 3px; color: #2c3e50; font-size: 24px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
th { background: #2c3e50; color: white; }
.summary-box { margin: 12px 0; padding: 12px; background: #fff3e0; border-radius: 6px; border: 2px solid #ff9800; }
</style></head>
<body>
<div class="header">
    <h1>SAI GANGA HOTEL</h1>
    <div style="font-size: 11px; margin: 8px 0;">${HOTEL_ADDRESS}</div>
    <p style="color: #27ae60; font-weight: bold;">🌿 100% PURE VEG</p>
    <div style="font-size: 18px; margin: 12px 0; font-weight: bold;">BOOKING INVOICE</div>
    <p><strong>Invoice:</strong> ${booking['Booking ID']}</p>
    <p style="font-size: 11px;">Date: ${booking['Date']} | Time: ${booking['Time']}</p>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0;">
    <div style="padding: 10px; background: #f8f9fa; border-radius: 6px;">
        <h3 style="font-size: 13px; margin-bottom: 6px;">👤 Customer</h3>
        <p><strong>Name:</strong> ${booking['Customer Name']}</p>
        <p><strong>Mobile:</strong> ${booking['Mobile']}</p>
        <p><strong>Address:</strong> ${booking['Address'] || 'N/A'}</p>
        <p><strong>Persons:</strong> ${booking['No. of Persons']}</p>
    </div>
    <div style="padding: 10px; background: #f8f9fa; border-radius: 6px;">
        <h3 style="font-size: 13px; margin-bottom: 6px;">🏨 Booking</h3>
        <p><strong>Room:</strong> ${booking['Room Number']} (${roomType})</p>
        <p><strong>Check-in:</strong> ${booking['Check In']} ${booking['Check In Time'] || ''}</p>
        <p><strong>Check-out:</strong> ${booking['Check Out'] || 'Not set'} ${booking['Check Out Time'] ? `<span style="color: #e74c3c; font-weight: bold;">${booking['Check Out Time']}</span>` : ''}</p>
        <p><strong>Nights:</strong> ${nights}</p>
    </div>
</div>

${paymentHistoryHTML}

<table>
    <thead><tr><th>Description</th><th style="text-align: right;">Amount</th></tr></thead>
    <tbody>
        <tr><td>🛏️ Room Charges (${nights} ${nights === 1 ? 'night' : 'nights'} @ ₹${roomAmountPerNight}/night)</td>
            <td style="text-align: right; font-weight: bold;">₹${totalRoomAmount}</td></tr>
        ${booking['Additional Amount'] > 0 ? `<tr><td>➕ Additional Charges</td><td style="text-align: right; font-weight: bold;">₹${booking['Additional Amount']}</td></tr>` : ''}
        ${foodHTML}
    </tbody>
</table>

<div class="summary-box">
    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-bottom: 6px;">
        <span>💵 Total Amount:</span><span>₹${totalAmount}</span>
    </div>
    <div style="display: flex; justify-content: space-between; color: #2e7d32; margin: 6px 0;">
        <span>✅ Paid:</span><span>₹${totalPaidForBalance}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: ${currentBalance === 0 ? '#2e7d32' : '#c62828'}; padding-top: 8px; border-top: 2px solid #ff9800;">
        <span>${currentBalance === 0 ? '✅' : '⚠️'} Balance:</span><span>₹${currentBalance}</span>
    </div>
</div>

${booking['Note'] ? `<div style="margin: 12px 0; padding: 10px; background: #fff9c4; border-left: 4px solid #fbc02d;">
    <p style="font-size: 11px;"><strong>📝 Note:</strong></p>
    <p style="font-size: 12px; margin-top: 4px;">${booking['Note']}</p>
</div>` : ''}

<div style="text-align: center; margin-top: 15px; padding-top: 12px; border-top: 2px solid #ddd; font-size: 11px;">
    <p style="font-weight: bold; font-size: 14px;">Thank you! 🙏</p>
    <p style="margin: 8px 0; font-weight: bold;">📞 8390400008</p>
</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

function printFoodInvoice(invoice) {
    console.log('Print food invoice:', invoice);
}

function shareWhatsApp(bookingId) {
    const b = bookings.find(x => x['Booking ID'] === bookingId);
    if (!b) return;
    
    const msg = `*SAI GANGA HOTEL - BOOKING*\n📋 ${b['Booking ID']}\n👤 ${b['Customer Name']}\n🏠 Room: ${b['Room Number']}\n💰 Total: ₹${b['Total Amount']}\n✅ Paid: ₹${b['Advance']}\n⚠️ Balance: ₹${b['Balance']}`;
    
    window.open(`https://wa.me/91${b['Mobile']}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==================== SEARCH & EXPORT ====================

/*function searchBookings() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}*/

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}

function searchPayments() {
    const searchTerm = document.getElementById('paymentSearch')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}

function downloadExcel(type) {
  // This will open the file download in a new tab
  window.open(`${API_URL}/export/${encodeURIComponent(type)}`, "_blank");
}
console.log('🚀 Dashboard JS fully loaded!');