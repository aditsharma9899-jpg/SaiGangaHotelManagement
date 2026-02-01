// ==================== PRINT INVOICE ====================


function printInvoice(bookingId) {
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
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


// ==================== ATTENDANCE CALENDAR ====================
function renderAttendanceCalendar() {
    const monthDisplay = document.getElementById('attendanceMonthDisplay');
    const calendarView = document.getElementById('attendanceCalendarView');
    const reportView = document.getElementById('attendanceReportView');
    
    if (!monthDisplay) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const year = currentAttendanceMonth.getFullYear();
    const month = currentAttendanceMonth.getMonth();
    
    monthDisplay.textContent = `${monthNames[month]} ${year}`;
    
    if (currentAttendanceView === 'calendar') {
        calendarView.style.display = 'block';
        reportView.style.display = 'none';
        renderCalendarView(year, month);
    } else {
        calendarView.style.display = 'none';
        reportView.style.display = 'block';
        renderReportView(year, month);
    }
}

function renderCalendarView(year, month) {
    const grid = document.getElementById('attendanceGrid');
    if (!grid) return;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = `
        <div style="display: grid; grid-template-columns: 150px repeat(${daysInMonth}, 50px); gap: 2px; background: #ecf0f1; padding: 10px; border-radius: 8px; overflow-x: auto;">
            <div style="background: #34495e; color: white; padding: 10px; font-weight: bold; position: sticky; left: 0; z-index: 10;">Staff Name</div>`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        html += `<div style="background: #34495e; color: white; padding: 10px; text-align: center; font-weight: bold; min-width: 50px;">${day}</div>`;
    }
    
    if (staff.length === 0) {
        html += `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #7f8c8d; background: white; border-radius: 5px;">No staff members added yet</div>`;
    } else {
        staff.forEach(staffMember => {
            html += `<div style="background: white; padding: 10px; font-weight: 600; position: sticky; left: 0; z-index: 5; border-right: 2px solid #bdc3c7;">${staffMember.Name}</div>`;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const staffKey = `${staffMember['Staff ID']}_${dateKey}`;
                
                const attendanceRecord = attendance.find(a => {
                    const aDate = a.Date.split('/').reverse().join('-');
                    return a['Staff ID'] === staffMember['Staff ID'] && aDate === dateKey;
                });
                
                let bgColor = '#ecf0f1';
                let text = '-';
                let borderColor = '#bdc3c7';
                
                if (attendanceRecord) {
                    if (attendanceRecord.Status === 'Present') {
                        bgColor = '#2ecc71';
                        text = 'P';
                        borderColor = '#27ae60';
                    } else if (attendanceRecord.Status === 'Absent') {
                        bgColor = '#e74c3c';
                        text = 'A';
                        borderColor = '#c0392b';
                    }
                }
                
                html += `<div style="background: ${bgColor}; color: ${text === '-' ? '#7f8c8d' : 'white'}; padding: 10px; text-align: center; font-weight: bold; border: 2px solid ${borderColor}; min-width: 50px; cursor: pointer;" 
                         onclick="markAttendanceFromCalendar('${staffMember['Staff ID']}', '${dateKey}')" 
                         title="Click to mark attendance">${text}</div>`;
            }
        });
    }
    
    html += `</div>`;
    grid.innerHTML = html;
}

function renderReportView(year, month) {
    const reportTable = document.getElementById('attendanceReportTable');
    if (!reportTable) return;
    
    if (staff.length === 0) {
        reportTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No staff members added yet</td></tr>';
        return;
    }
    
    let html = '';
    
    staff.forEach(staffMember => {
        const staffAttendance = attendance.filter(a => {
            const aDate = new Date(a.Date.split('/').reverse().join('-'));
            return a['Staff ID'] === staffMember['Staff ID'] && 
                   aDate.getMonth() === month && 
                   aDate.getFullYear() === year;
        });
        
        const presentDays = staffAttendance.filter(a => a.Status === 'Present').length;
        const absentDays = staffAttendance.filter(a => a.Status === 'Absent').length;
        const totalMarked = presentDays + absentDays;
        const attendancePercent = totalMarked > 0 ? ((presentDays / totalMarked) * 100).toFixed(1) : 0;
        
        const percentColor = attendancePercent >= 80 ? '#27ae60' : 
                            attendancePercent >= 60 ? '#f39c12' : '#e74c3c';
        
        html += `
            <tr>
                <td>${staffMember.Name}</td>
                <td>${staffMember.Position}</td>
                <td style="color: #27ae60; font-weight: bold;">${presentDays}</td>
                <td style="color: #e74c3c; font-weight: bold;">${absentDays}</td>
                <td>${totalMarked}</td>
                <td style="color: ${percentColor}; font-weight: bold; font-size: 16px;">${attendancePercent}%</td>
            </tr>
        `;
    });
    
    reportTable.innerHTML = html;
}

function markAttendanceFromCalendar(staffId, dateKey) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    const dateObj = new Date(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    if (dateObj > today) {
        alert('⚠️ Cannot mark attendance for future dates');
        return;
    }
    
    const existingRecord = attendance.find(a => {
        const aDate = a.Date.split('/').reverse().join('-');
        return a['Staff ID'] === staffId && aDate === dateKey;
    });
    
    if (existingRecord) {
        const changeStatus = confirm(
            `Current Status: ${existingRecord.Status}\n\n` +
            `Do you want to change it?\n` +
            `OK = Present | Cancel = Absent`
        );
        
        existingRecord.Status = changeStatus ? 'Present' : 'Absent';
        existingRecord.Time = new Date().toLocaleTimeString();
        
        saveAttendanceToServer(existingRecord);
    } else {
        const status = confirm(
            `Mark attendance for ${staffMember.Name}?\n\n` +
            `OK = Present | Cancel = Absent`
        ) ? 'Present' : 'Absent';
        
        const newRecord = {
            'Attendance ID': 'ATT' + String(attendance.length + 1).padStart(4, '0'),
            'Staff ID': staffId,
            'Staff Name': staffMember.Name,
            'Date': dateKey.split('-').reverse().join('/'),
            'Time': new Date().toLocaleTimeString(),
            'Status': status
        };
        
        attendance.push(newRecord);
        saveAttendanceToServer(newRecord);
    }
    
    renderAttendanceCalendar();
}

async function saveAttendanceToServer(record) {
    try {
        await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
    }
}


// ==================== STAFF MANAGEMENT ====================

function updateStaffTable() {
    const staffTable = document.getElementById('staffTable');
    if (!staffTable) return;
    
    if (staff.length === 0) {
        staffTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">No staff members yet.</td></tr>';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    staffTable.innerHTML = staff.map(s => {
        const todayAttendance = attendance.find(a => 
            a['Staff ID'] === s['Staff ID'] && 
            a.Date.includes(today)
        );
        
        const attendanceStatus = todayAttendance 
            ? `<span class="badge badge-${todayAttendance.Status === 'Present' ? 'success' : 'danger'}">${todayAttendance.Status}</span>`
            : '<span class="badge" style="background: #95a5a6; color: white;">Not Marked</span>';
        
        return `
            <tr>
                <td>${s['Staff ID']}</td>
                <td>${s.Name}</td>
                <td>${s.Mobile}</td>
                <td>${s.Position}</td>
                <td>₹${s.Salary}</td>
                <td>${s['Join Date']}</td>
                <td>
                    ${attendanceStatus}
                    ${!todayAttendance ? `
                        <div style="margin-top: 5px;">
                            <button class="action-btn btn-success" onclick="markAttendance('${s['Staff ID']}', 'Present')" 
                                    style="padding: 4px 8px; font-size: 10px;">P</button>
                            <button class="action-btn btn-danger" onclick="markAttendance('${s['Staff ID']}', 'Absent')" 
                                    style="padding: 4px 8px; font-size: 10px;">A</button>
                        </div>
                    ` : ''}
                </td>
                <td>
                    <button class="action-btn btn-warning" onclick="openEditStaffModal('${s['Staff ID']}')">✏️ Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteStaff('${s['Staff ID']}')">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    const attendanceTable = document.getElementById('attendanceTable');
    if (attendanceTable) {
        if (attendance.length === 0) {
            attendanceTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No attendance records yet</td></tr>';
        } else {
            const sortedAttendance = [...attendance].sort((a, b) => {
                const dateA = new Date(a.Date.split('/').reverse().join('-'));
                const dateB = new Date(b.Date.split('/').reverse().join('-'));
                return dateB - dateA;
            });
            
            attendanceTable.innerHTML = sortedAttendance.map(a => `
                <tr>
                    <td>${a['Attendance ID']}</td>
                    <td>${a['Staff ID']}</td>
                    <td>${a['Staff Name']}</td>
                    <td>${a.Date}</td>
                    <td>${a.Time}</td>
                    <td><span class="badge badge-${a.Status === 'Present' ? 'success' : 'danger'}">${a.Status}</span></td>
                </tr>
            `).join('');
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
    
    const staffId = document.getElementById('staffId').value;
    const staffData = {
        'Staff ID': staffId || 'STAFF' + String(staff.length + 1).padStart(4, '0'),
        'Name': document.getElementById('staffName').value,
        'Mobile': document.getElementById('staffMobile').value,
        'Position': document.getElementById('staffPosition').value,
        'Salary': parseInt(document.getElementById('staffSalary').value),
        'Join Date': document.getElementById('staffJoinDate').value
    };
    
    try {
        let response;
        if (staffId) {
            response = await fetch(`${API_URL}/staff/${staffId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staffData)
            });
        } else {
            response = await fetch(`${API_URL}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staffData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(staffId ? '✅ Staff updated successfully!' : '✅ Staff added successfully!');
            closeStaffModal();
            await loadAllData();
        } else {
            alert('❌ Failed to save staff');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        alert('❌ Error saving staff');
    }
    
    return false;
}

async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
        const response = await fetch(`${API_URL}/staff/${staffId}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert('✅ Staff deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        alert('❌ Failed to delete staff');
    }
}

async function markAttendance(staffId, status) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    const attendanceRecord = {
        'Attendance ID': 'ATT' + String(attendance.length + 1).padStart(4, '0'),
        'Staff ID': staffId,
        'Staff Name': staffMember.Name,
        'Date': new Date().toLocaleDateString('en-GB'),
        'Time': new Date().toLocaleTimeString(),
        'Status': status
    };
    
    try {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecord)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Attendance marked as ${status}`);
            await loadAllData();
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        alert('❌ Failed to mark attendance');
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
    if (!foodMenu) return;
    foodMenu.innerHTML = '';
    if (filteredFoodItems.length === 0) {
        foodMenu.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px; grid-column: 1/-1;">No items found</p>';
        return;
    }
    filteredFoodItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'food-item';
        div.innerHTML = `<h4>${item.name}</h4><div class="price">₹${item.price}</div>
            <div class="quantity-control">
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, -1)">-</button>
                <span class="quantity-display" id="qty-${item.id}">${foodOrder[item.id] || 0}</span>
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, 1)">+</button>
            </div>`;
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

function createFoodOrder() {
    let hasItems = false, orderItems = [], totalAmount = 0;
    for (let id in foodOrder) {
        if (foodOrder[id] > 0) {
            hasItems = true;
            const item = foodItems.find(i => i.id == id);
            if (item && item.price) {
                orderItems.push({ name: item.name, quantity: foodOrder[id], price: item.price, total: item.price * foodOrder[id] });
                totalAmount += item.price * foodOrder[id];
            }
        }
    }
    if (!hasItems) { alert('Please select at least one food item'); return; }
    const foodInvoice = {
        type: 'Food Order',
        id: 'FOOD' + String(Date.now()).slice(-6),
        items: orderItems,
        totalAmount: totalAmount,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString()
    };
    printFoodInvoice(foodInvoice);
    alert('✅ Food order invoice generated!');
    foodOrder = {};
    filteredFoodItems = [...foodItems];
    const searchInput = document.getElementById('foodSearch');
    if (searchInput) searchInput.value = '';
    initializeFoodMenu();
    updateFoodTotal();
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
                    <button class="action-btn btn-warning" onclick="editFoodItem(${item.id})">✏️ Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteFoodItem(${item.id})">🗑️ Delete</button>
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

function editFoodItem(itemId) {
    const item = foodItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('foodModalTitle').textContent = 'Edit Food Item';
    document.getElementById('foodItemId').value = item.id;
    document.getElementById('foodItemName').value = item.name;
    document.getElementById('foodItemPrice').value = item.price;
    currentEditingFoodItem = item;
    document.getElementById('foodItemModal').classList.add('active');
}

function deleteFoodItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const index = foodItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
        foodItems.splice(index, 1);
        saveFoodItems();
        renderFoodMenuManager();
        initializeFoodMenu();
        alert('✅ Food item deleted successfully!');
    }
}

function handleFoodItemSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('foodItemId').value;
    const itemName = document.getElementById('foodItemName').value;
    const itemPrice = parseInt(document.getElementById('foodItemPrice').value);
    
    if (itemId) {
        const item = foodItems.find(i => i.id == itemId);
        if (item) {
            item.name = itemName;
            item.price = itemPrice;
            alert('✅ Food item updated successfully!');
        }
    } else {
        const newId = foodItems.length > 0 ? Math.max(...foodItems.map(i => i.id)) + 1 : 1;
        foodItems.push({
            id: newId,
            name: itemName,
            price: itemPrice
        });
        alert('✅ Food item added successfully!');
    }
    
    saveFoodItems();
    filteredFoodItems = [...foodItems];
    renderFoodMenuManager();
    initializeFoodMenu();
    closeFoodItemModal();
    
    return false;
}

function closeFoodItemModal() {
    document.getElementById('foodItemModal').classList.remove('active');
}

function openFoodMenuForBooking(bookingId) {
    currentBookingForFood = bookingId;
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    
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
    const documents = [];
    const fileInputs = ['doc1Front', 'doc1Back', 'doc2Front', 'doc2Back'];
    
    for (const inputId of fileInputs) {
        const input = document.getElementById(inputId);
        if (input && input.files && input.files[0]) {
            try {
                const file = input.files[0];
                const base64Data = await fileToBase64(file);
                
                documents.push({
                    name: file.name,
                    data: base64Data,
                    type: file.type
                });
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    }
    
    if (documents.length === 0) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customerId,
                bookingId: bookingId,
                documents: documents
            })
        });
        
        const result = await response.json();
        
        if (result.googleDriveFolderUrl) {
            alert(
                `📄 ${documents.length} document(s) ready for upload!\n\n` +
                `📁 Please upload them to Google Drive:\n${result.googleDriveFolderUrl}\n\n` +
                `Files: ${documents.map(d => d.name).join(', ')}`
            );
        }
        
        return result.documents || null;
    } catch (error) {
        console.error('Document upload error:', error);
        return null;
    }
}

// ✅ FIX: View documents with download option
async function viewCustomerDocuments(customerId) {
    try {
        const customer = customers.find(c => c['Customer ID'] === customerId);
        
        if (!customer || !customer.documents || customer.documents.length === 0) {
            alert(
                `📄 No documents for this customer\n\n` +
                `📁 All documents are stored in:\n${GOOGLE_DRIVE_FOLDER_URL}`
            );
            return;
        }
        
        // Create modal to show documents
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>📄 Customer Documents</h2>
                    <span class="close-btn" onclick="this.closest('.modal').remove()">×</span>
                </div>
                <div style="margin: 20px 0;">
                    <p><strong>Customer:</strong> ${customer.Name}</p>
                    <p><strong>Mobile:</strong> ${customer.Mobile}</p>
                    </p>
                    <h3 style="margin-top: 20px;">Uploaded Documents:</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${customer.documents.map((doc, i) => `
                            <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${i + 1}. ${doc.originalName || doc.filename}</strong><br>
                                    <small style="color: #666;">Uploaded: ${new Date(doc.uploadDate).toLocaleString()}</small>
                                </div>
                                <a href="${doc.url}" download class="btn btn-primary" style="padding: 8px 15px; text-decoration: none; white-space: nowrap;">
                                    ⬇️ Download
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing documents:', error);
        alert('❌ Error loading documents');
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
