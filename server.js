const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const path = require('path');
const connectDB = require('./config/db');
const bookingsRoutes = require('./routes/bookingRoutes')
const roomsRoutes = require("./routes/roomRoutes");
const customersRoutes = require("./routes/customerRoutes");
const paymentsRoutes = require("./routes/paymentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const foodRoutes = require("./routes/foodRoutes");
const documentRoutes = require("./routes/documentRoutes");
const foodOrderRoutes = require("./routes/foodOrderRoutes");
const staffRoutes = require("./routes/staffRoutes");
const exportRoutes = require("./routes/exportRoutes");


const app = express();
const PORT = process.env.PORT || 3001;


// ✅ ENSURE DIRECTORIES EXIST

connectDB()

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));


app.use("/newapi/bookings",bookingsRoutes);
app.use("/newapi/rooms", roomsRoutes);
app.use("/newapi/customers",customersRoutes);
app.use("/newapi/payments", paymentsRoutes);
app.use("/newapi/attendance", attendanceRoutes);
app.use("/newapi/food", foodRoutes);
app.use("/newapi/food-orders", foodOrderRoutes);
app.use("/newapi/staff", staffRoutes);
app.use("/newapi/export", exportRoutes);
app.use("/newapi/customerDocuments", documentRoutes);


let rooms = [];
let bookings = [];
let customers = [];

(async () => {
  //  await ensureDirs();
  //  await loadData();
    console.log('🚀 Server initialized');
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.post('/api/bookings/:id/checkout', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = bookings.find(b => b['Booking ID'] === bookingId);
        
        if (booking) {
            const checkoutTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            booking['Check Out Time'] = checkoutTime;
            booking.Status = 'Checked Out';
            
            if (booking['Room Number'] && !booking['Room Number'].includes('TBD')) {
                const roomNumbers = booking['Room Number'].split(', ');
                roomNumbers.forEach(roomNum => {
                    const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                    if (room) room.Status = 'available';
                });
            }
            
            await saveData();
            res.json({ success: true, checkoutTime: checkoutTime });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('❌ Error during checkout:', error);
        res.status(500).json({ error: 'Failed to checkout' });
    }
});




let sessions = {};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin@123') {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessions[sessionId] = {
            username: username,
            createdAt: new Date(),
            lastAccess: new Date()
        };
        
        res.json({ success: true, sessionId: sessionId });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/verify-session', (req, res) => {
    const { sessionId } = req.body;
    
    if (sessions[sessionId]) {
        sessions[sessionId].lastAccess = new Date();
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`💾 Data persistence: ENABLED`);
    console.log(`📁 Documents auto-save to Excel: ENABLED`);
    console.log(`📊 Current data: Bookings: ${bookings.length}, Customers: ${customers.length}`);
});